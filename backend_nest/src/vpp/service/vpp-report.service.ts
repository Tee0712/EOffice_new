import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');

@Injectable()
export class VppReportService {
  constructor(
    @InjectRepository(ProductEntity, 'mssqlConnection') private readonly productRepo: Repository<ProductEntity>,
  ) { }

  private parsePositiveInt(value: any, fallback: number, max = 2000) {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, max);
  }

  private resolveDateRange(query: any) {
    const { period_month, period_year, fromDate, toDate } = query || {};
    const now = new Date();

    const parsedFrom = fromDate ? moment(fromDate, 'YYYY-MM-DD', true) : null;
    const parsedTo = toDate ? moment(toDate, 'YYYY-MM-DD', true) : null;

    if (parsedFrom?.isValid() && parsedTo?.isValid()) {
      const from = parsedFrom.startOf('day');
      const to = parsedTo.endOf('day');
      return {
        startDate: from.toDate(),
        endDate: to.toDate(),
        month: from.month() + 1,
        year: from.year(),
      };
    }

    const month = period_month ? parseInt(period_month) : now.getMonth() + 1;
    const year = period_year ? parseInt(period_year) : now.getFullYear();
    const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').startOf('month').toDate();
    const endDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').endOf('month').toDate();

    return { startDate, endDate, month, year };
  }

  async getSummary(query: any) {
    const { department } = query;
    const { startDate, endDate, month, year } = this.resolveDateRange(query);

    const sqlSummary = `
      SELECT 
        COUNT(DISTINCT CASE WHEN it.transaction_type = 'ISSUE' THEN it.id END) as total_requests,
        SUM(CASE WHEN it.transaction_type = 'RECEIPT' THEN iti.actual_quantity ELSE 0 END) as total_import,
        SUM(CASE WHEN it.transaction_type = 'ISSUE' THEN iti.actual_quantity ELSE 0 END) as total_export,
        SUM(CASE WHEN it.transaction_type = 'ISSUE' THEN iti.actual_quantity * iti.unit_price ELSE 0 END) as total_export_value
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      LEFT JOIN GoodsIssue gi ON gi.transaction_id = it.id
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED')
      AND it.created_at >= @0 AND it.created_at <= @1
      AND (gi.department = @2 OR @2 IS NULL)
    `;

    const summaryRes = await this.productRepo.query(sqlSummary, [startDate, endDate, department || null]);
    const summary = summaryRes[0] || {};

    const sqlOpening = `
      SELECT SUM(CASE WHEN it.transaction_type = 'RECEIPT' THEN iti.actual_quantity ELSE -iti.actual_quantity END) as opening
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.created_at < @0
    `;
    const openingRes = await this.productRepo.query(sqlOpening, [startDate]);
    const opening = Number(openingRes[0]?.opening || 0);

    const total_import = Number(summary.total_import || 0);
    const total_export = Number(summary.total_export || 0);
    const closing = opening + total_import - total_export;

    // Chi phí và KPI của Tab 1
    const deptData = await this.getByDepartment(query);
    const max_dept = deptData.data.items[0]?.department_name || '-';

    // Chi phí và KPI của Tab 2 (Thực tế vs Định mức)
    const quotaData = await this.getActualVsQuota(query);
    const total_actual = quotaData.data.items.reduce((s: number, i: any) => s + i.actual, 0);
    const total_quota  = quotaData.data.items.reduce((s: number, i: any) => s + i.quota, 0);

    return {
      success: true,
      data: {
        // Tab 0 KPIs
        opening,
        import: total_import,
        export: total_export,
        adjustment: 0,
        closing,
        value: Number(summary.total_export_value || 0),
        total_export_value: Number(summary.total_export_value || 0),
        
        // Tab 1 KPIs
        total_requests: Number(summary.total_requests || 0),
        total_items: total_export,
        total_cost: Number(summary.total_export_value || 0),
        max_dept,

        // Tab 2 KPIs
        total_actual,
        total_quota,
        remain: total_quota - total_actual,
        safe_ratio: total_quota > 0 ? Math.round((total_actual / total_quota) * 100) : 0,

        // Tab 3 KPIs
        total: Number(summary.total_export_value || 0),
        last_month: 0,
        trend: 0,
        efficiency: 85.5,
        period_month: month,
        period_year: year
      }
    };
  }

  async getStockMovement(query: any) {
    const { department, category, keyword } = query;
    const limit = this.parsePositiveInt(query.limit ?? query.pageSize, 200);
    const page = this.parsePositiveInt(query.page, 1);
    const skip = (page - 1) * limit;
    const { startDate, endDate } = this.resolveDateRange(query);
    const keywordFilter = keyword ? `%${keyword}%` : null;

    const sql = `
      SELECT 
        p.id, p.code, p.name, p.category, p.unit, p.reference_price,
        ISNULL(openingMap.qty, 0) as opening_stock,
        ISNULL(currentMap.imp, 0) as import_qty,
        ISNULL(currentMap.exp, 0) as export_qty,
        ISNULL(currentMap.val, 0) as export_value
      FROM Product p
      LEFT JOIN (
        SELECT iti.product_id, SUM(CASE WHEN it.transaction_type = 'RECEIPT' THEN iti.actual_quantity ELSE -iti.actual_quantity END) as qty
        FROM InventoryTransaction it
        JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
        WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.created_at < @0
        GROUP BY iti.product_id
      ) openingMap ON openingMap.product_id = p.id
      LEFT JOIN (
        SELECT 
          iti.product_id,
          SUM(CASE WHEN it.transaction_type = 'RECEIPT' THEN iti.actual_quantity ELSE 0 END) as imp,
          SUM(CASE WHEN it.transaction_type = 'ISSUE' THEN iti.actual_quantity ELSE 0 END) as exp,
          SUM(CASE WHEN it.transaction_type = 'ISSUE' THEN iti.actual_quantity * iti.unit_price ELSE 0 END) as val
        FROM InventoryTransaction it
        JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
        LEFT JOIN GoodsIssue gi ON gi.transaction_id = it.id
        WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED')
        AND it.created_at >= @0 AND it.created_at <= @1
        AND (@2 IS NULL OR gi.department = @2 OR it.transaction_type = 'RECEIPT')
        GROUP BY iti.product_id
      ) currentMap ON currentMap.product_id = p.id
      WHERE (@3 IS NULL OR p.category = @3)
      AND (@4 IS NULL OR p.name LIKE @4 OR p.code LIKE @4)
      ORDER BY p.id DESC
      OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const countSql = `
      SELECT COUNT(1) as total
      FROM Product p
      WHERE (@0 IS NULL OR p.category = @0)
      AND (@1 IS NULL OR p.name LIKE @1 OR p.code LIKE @1)
    `;

    const [items, countRes] = await Promise.all([
      this.productRepo.query(sql, [startDate, endDate, department || null, category || null, keywordFilter]),
      this.productRepo.query(countSql, [category || null, keywordFilter]),
    ]);
    
    const processedItems = items.map((i: any) => {
      const opening = Number(i.opening_stock);
      const imp = Number(i.import_qty);
      const exp = Number(i.export_qty);
      const closing = opening + imp - exp;
      const refPrice = Number(i.reference_price || 0);

      return {
        ...i,
        opening_stock: opening,
        import_qty: imp,
        export_qty: exp,
        adjust_qty: 0,
        closing_stock: closing,
        export_value: Number(i.export_value),
        closing_value: closing * refPrice,
        stock_status: closing > 30 ? 'in_stock' : closing > 0 ? 'low_stock' : 'out_of_stock'
      };
    });

    const summaryRes = await this.getSummary(query);

    return {
      success: true,
      data: {
        summary: summaryRes.data,
        items: processedItems,
        total: Number(countRes?.[0]?.total || 0),
        page,
        limit
      }
    };
  }

  async getByDepartment(query: any) {
    const { startDate, endDate } = this.resolveDateRange(query);
    const prevMonthStart = moment(startDate).subtract(1, 'month').startOf('month').toDate();
    const prevMonthEnd = moment(startDate).subtract(1, 'month').endOf('month').toDate();

    const sqlCurrent = `
      SELECT 
        ISNULL(ou.name, gi.department) as department_name,
        COUNT(DISTINCT it.id) as requests,
        SUM(iti.actual_quantity) as qty,
        SUM(iti.actual_quantity * iti.unit_price) as cost
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON u.id = gi.receiver_id
      LEFT JOIN organization_units ou ON ou.id = u.parent
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.transaction_type = 'ISSUE'
      AND it.created_at >= @0 AND it.created_at <= @1
      GROUP BY ISNULL(ou.name, gi.department)
      ORDER BY cost DESC
    `;

    const sqlPrev = `
      SELECT 
        ISNULL(ou.name, gi.department) as department_name,
        SUM(iti.actual_quantity * iti.unit_price) as cost
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON u.id = gi.receiver_id
      LEFT JOIN organization_units ou ON ou.id = u.parent
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.transaction_type = 'ISSUE'
      AND it.created_at >= @0 AND it.created_at <= @1
      GROUP BY ISNULL(ou.name, gi.department)
    `;

    const currentData = await this.productRepo.query(sqlCurrent, [startDate, endDate]);
    const prevData = await this.productRepo.query(sqlPrev, [prevMonthStart, prevMonthEnd]);

    const prevMap = prevData.reduce((acc: any, cur: any) => {
      acc[cur.department_name] = Number(cur.cost || 0);
      return acc;
    }, {});

    const grandTotalCost = currentData.reduce((sum: number, item: any) => sum + Number(item.cost || 0), 0);

    const items = currentData.map((item: any) => {
      const cost = Number(item.cost || 0);
      const prevCost = prevMap[item.department_name] || 0;
      const trend = prevCost > 0 ? Math.round(((cost - prevCost) / prevCost) * 100) : 0;
      const percentage = grandTotalCost > 0 ? Math.round((cost / grandTotalCost) * 100) : 0;

      return {
        ...item,
        requests: Number(item.requests || 0),
        qty: Number(item.qty || 0),
        cost: cost,
        trend: trend,
        percentage: percentage
      };
    });

    return { success: true, data: { items } };
  }

  async getActualVsQuota(query: any) {
    const { startDate, endDate, month, year } = this.resolveDateRange(query);

    const sqlActual = `
      SELECT 
        ISNULL(ou.name, gi.department) as department_name,
        SUM(iti.actual_quantity * iti.unit_price) as actual
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON u.id = gi.receiver_id
      LEFT JOIN organization_units ou ON ou.id = u.parent
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.transaction_type = 'ISSUE'
      AND it.created_at >= @0 AND it.created_at <= @1
      GROUP BY ISNULL(ou.name, gi.department)
    `;

    const sqlQuota = `
      SELECT 
        ou.name as department_name,
        SUM(pl.quantity_limit * p.reference_price) as quota
      FROM ProductLimit pl
      JOIN Product p ON p.id = pl.product_id
      JOIN organization_units ou ON ou.id = pl.organization_unit_id
      WHERE pl.limit_month = @0 AND pl.limit_year = @1
      GROUP BY ou.name
    `;

    const actualData = await this.productRepo.query(sqlActual, [startDate, endDate]);
    const quotaData  = await this.productRepo.query(sqlQuota, [month, year]);

    const departments = Array.from(new Set([
      ...actualData.map((d: any) => d.department_name),
      ...quotaData.map((d: any) => d.department_name)
    ]));

    const items = departments.map(dept => {
      const actual = actualData.find((a: any) => a.department_name === dept)?.actual || 0;
      const quota  = quotaData.find((q: any) => q.department_name === dept)?.quota || 0;
      return {
        id: dept,
        department_name: dept,
        actual: Number(actual),
        quota: Number(quota),
        remain: Number(quota) - Number(actual),
        percentage: Number(quota) > 0 ? Math.round((Number(actual) / Number(quota)) * 100) : 0
      };
    });

    return { success: true, data: { items } };
  }

  async getCostSummary(query: any) {
    const { category, keyword } = query;
    const { startDate, endDate } = this.resolveDateRange(query);

    const sql = `
      SELECT 
        p.id, p.code, p.name, p.category as category_name, p.unit,
        SUM(iti.actual_quantity) as qty,
        SUM(iti.actual_quantity * iti.unit_price) as cost
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      JOIN Product p ON p.id = iti.product_id
      WHERE it.status IN ('completed', 'FINISHED', 'PARTIAL', 'APPROVED') AND it.transaction_type = 'ISSUE'
      AND it.created_at >= @0 AND it.created_at <= @1
      AND (@2 IS NULL OR p.category = @2)
      AND (@3 IS NULL OR p.name LIKE @3 OR p.code LIKE @3)
      GROUP BY p.id, p.code, p.name, p.category, p.unit
      ORDER BY cost DESC
    `;

    const items = await this.productRepo.query(sql, [startDate, endDate, category || null, keyword ? `%${keyword}%` : null]);
    const totalCost = items.reduce((sum: number, i: any) => sum + Number(i.cost), 0);
    const processedItems = items.map((i: any) => ({
      ...i,
      qty: Number(i.qty || 0),
      cost: Number(i.cost || 0),
      percentage: totalCost > 0 ? Math.round((Number(i.cost) / totalCost) * 100) : 0,
    }));

    return { success: true, data: { items: processedItems, total_cost: totalCost } };
  }

  async exportReport(query: any, res: any) {
    const toNumber = (value: any, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    };
    const toText = (value: any, fallback = '') => (value === undefined || value === null ? fallback : String(value));

    const resolveExportTab = () => {
      const tabFromActive = Number.parseInt(String(query?.activeTab ?? ''), 10);
      if (Number.isInteger(tabFromActive) && tabFromActive >= 0 && tabFromActive <= 3) return tabFromActive;

      const reportKey = String(query?.tab || query?.reportType || '').trim().toLowerCase();
      if (reportKey === 'department') return 1;
      if (reportKey === 'usage-vs-quota' || reportKey === 'quota') return 2;
      if (reportKey === 'cost') return 3;
      return 0;
    };

    const getExcelColumn = (index: number) => {
      let value = '';
      let current = index;
      while (current > 0) {
        const mod = (current - 1) % 26;
        value = String.fromCharCode(65 + mod) + value;
        current = Math.floor((current - 1) / 26);
      }
      return value;
    };

    const tab = resolveExportTab();
    const format = String(query?.format || 'xlsx').toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
    const now = new Date();
    const month = toNumber(query?.period_month, now.getMonth() + 1);
    const year = toNumber(query?.period_year, now.getFullYear());

    let title = `BÁO CÁO VPP - THÁNG ${month}/${year}`;
    let headers: string[] = [];
    let rows: Array<Array<string | number>> = [];

    if (tab === 0) {
      const reportData = await this.getStockMovement(query);
      const items = reportData?.data?.items || [];
      title = `BÁO CÁO XUẤT - NHẬP - TỒN VĂN PHÒNG PHẨM - THÁNG ${month}/${year}`;
      headers = ['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Tồn đầu', 'Nhập', 'Xuất', 'Tồn cuối', 'Giá trị tồn'];
      rows = items.map((item: any, idx: number) => [
        idx + 1,
        toText(item.code, '-'),
        toText(item.name, '-'),
        toText(item.unit, '-'),
        toNumber(item.opening_stock),
        toNumber(item.import_qty),
        toNumber(item.export_qty),
        toNumber(item.closing_stock),
        toNumber(item.closing_value),
      ]);
    } else if (tab === 1) {
      const reportData = await this.getByDepartment(query);
      const items = reportData?.data?.items || [];
      title = `BÁO CÁO CẤP PHÁT VPP THEO PHÒNG BAN - THÁNG ${month}/${year}`;
      headers = ['STT', 'Phòng ban', 'Số phiếu', 'Tổng số lượng', 'Tổng chi phí', 'Tỷ trọng (%)', 'Xu hướng'];
      rows = items.map((item: any, idx: number) => [
        idx + 1,
        toText(item.department_name, '-'),
        toNumber(item.requests),
        toNumber(item.qty),
        toNumber(item.cost),
        `${toNumber(item.percentage)}%`,
        `${toNumber(item.trend)}%`,
      ]);
    } else if (tab === 2) {
      const reportData = await this.getActualVsQuota(query);
      const items = reportData?.data?.items || [];
      title = `BÁO CÁO THỰC TẾ VÀ ĐỊNH MỨC - THÁNG ${month}/${year}`;
      headers = ['STT', 'Phòng ban', 'Thực tế (VNĐ)', 'Định mức (VNĐ)', 'Chênh lệch', 'Tỷ lệ sử dụng'];
      rows = items.map((item: any, idx: number) => {
        const actual = toNumber(item.actual);
        const quota = toNumber(item.quota);
        const usage = quota > 0 ? Math.round((actual / quota) * 100) : 0;
        return [
          idx + 1,
          toText(item.department_name, '-'),
          actual,
          quota,
          actual - quota,
          `${usage}%`,
        ];
      });
    } else {
      const reportData = await this.getCostSummary(query);
      const items = reportData?.data?.items || [];
      title = `BÁO CÁO CHI PHÍ TỔNG HỢP - THÁNG ${month}/${year}`;
      headers = ['STT', 'Mã hàng', 'Tên hàng', 'Nhóm hàng', 'ĐVT', 'Số lượng', 'Chi phí (VNĐ)', 'Tỷ trọng (%)'];
      rows = items.map((item: any, idx: number) => [
        idx + 1,
        toText(item.code, '-'),
        toText(item.name, '-'),
        toText(item.category_name, 'Khác'),
        toText(item.unit, '-'),
        toNumber(item.qty),
        toNumber(item.cost),
        `${toNumber(item.percentage)}%`,
      ]);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const safeMonth = String(month).padStart(2, '0');
      const fileName = `BaoCaoVPP_${safeMonth}_${year}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      doc.pipe(res);

      doc.fontSize(12).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica-Bold').text(headers.join(' | '));
      doc.moveDown(0.6);

      rows.forEach((row) => {
        if (doc.y > 760) {
          doc.addPage();
          doc.fontSize(9).font('Helvetica-Bold').text(headers.join(' | '));
          doc.moveDown(0.6);
        }
        doc.fontSize(8.5).font('Helvetica').text(row.map((value) => toText(value, '-')).join(' | '));
      });

      doc.end();
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Báo cáo VPP');
    const endColumn = getExcelColumn(Math.max(1, headers.length));

    sheet.mergeCells(`A1:${endColumn}1`);
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.getRow(3).values = headers;
    sheet.getRow(3).font = { bold: true };

    rows.forEach((row) => {
      sheet.addRow(row);
    });

    const safeMonth = String(month).padStart(2, '0');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BaoCaoVPP_${safeMonth}_${year}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
