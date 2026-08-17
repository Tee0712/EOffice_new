import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProgramEntity } from '../entities/program.entity';
import { DisbursementEntity } from '../entities/disbursement.entity';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(ProgramEntity, 'mssqlConnection')
    private readonly programRepo: Repository<ProgramEntity>,
    @InjectRepository(DisbursementEntity, 'mssqlConnection')
    private readonly disbursementRepo: Repository<DisbursementEntity>,
  ) {}

  /**
   * API 1: THỐNG KÊ TỔNG HỢP (KPI CARDS)
   */
  async getSummary(query: DashboardQueryDto) {
    const year = query.year || new Date().getFullYear();
    const { quarter } = query;
    const prevYear = year - 1;

    // Build WHERE clause for quarter
    let quarterFilterProg = '';
    let quarterFilterDisb = '';
    let quarterFilterCand = '';
    
    if (quarter && quarter !== 'Năm') {
      const qNum = quarter.substring(1);
      quarterFilterProg = `AND DATEPART(QUARTER, p.start_date) = ${qNum}`;
      quarterFilterDisb = `AND DATEPART(QUARTER, expected_transfer_date) = ${qNum}`;
      quarterFilterCand = `AND DATEPART(QUARTER, created_at) = ${qNum}`;
    }

    const sqlKPI = `
      SELECT 
        (SELECT SUM(pi.unit_price * pi.quantity) 
         FROM program_items pi 
         JOIN programs p ON p.id = pi.program_id 
         WHERE YEAR(p.start_date) = ${year} AND p.status != 'CANCELLED' ${quarterFilterProg}) as total_budget,
        
        (SELECT SUM(pi.unit_price * pi.quantity) 
         FROM program_items pi 
         JOIN programs p ON p.id = pi.program_id 
         WHERE YEAR(p.start_date) = ${prevYear} AND p.status != 'CANCELLED') as prev_total_budget,
        
        (SELECT 
            COALESCE((SELECT SUM(dd.amount) FROM disbursement_details dd 
             JOIN disbursements d ON d.id = dd.disbursement_id 
             WHERE YEAR(d.expected_transfer_date) = ${year} AND d.status = 'COMPLETED' 
             AND DATEPART(QUARTER, d.expected_transfer_date) = ${quarter && quarter !== 'Năm' ? quarter.substring(1) : 'DATEPART(QUARTER, d.expected_transfer_date)'}), 0) +
            COALESCE((SELECT SUM(a.unit_price * a.quantity) FROM assets a
             WHERE YEAR(a.created_at) = ${year} AND a.status IN ('PURCHASED','SHIPPING','DELIVERED')
             AND DATEPART(QUARTER, a.created_at) = ${quarter && quarter !== 'Năm' ? quarter.substring(1) : 'DATEPART(QUARTER, a.created_at)'}), 0)
        ) as disbursed_amount,
        
        (SELECT COUNT(*) FROM programs p WHERE YEAR(p.start_date) = ${year} AND (p.status IN ('ACTIVE','COMPLETED','IN_PROGRESS','dang_trien_khai','dang_giai_ngan') OR p.status LIKE 'dang_trien_khai%') ${quarterFilterProg}) as total_programs,
        (SELECT COUNT(*) FROM programs p WHERE YEAR(p.start_date) = ${prevYear} AND (p.status IN ('ACTIVE','COMPLETED','IN_PROGRESS','dang_trien_khai','dang_giai_ngan') OR p.status LIKE 'dang_trien_khai%')) as prev_total_programs,
        -- Beneficiaries (Count candidates + receiving units)
        (SELECT 
            (SELECT COUNT(DISTINCT id) FROM scholarship_candidates WHERE YEAR(created_at) = ${year} AND (status IN ('APPROVED','RECEIVING') OR status LIKE 'approved%') ${quarterFilterCand}) +
            (SELECT COUNT(DISTINCT receiving_unit) FROM disbursements WHERE YEAR(expected_transfer_date) = ${year} AND (status = 'COMPLETED' OR status LIKE 'hoan_thanh%') ${quarterFilterDisb})
        ) as total_beneficiaries,
        (SELECT 
            (SELECT COUNT(DISTINCT id) FROM scholarship_candidates WHERE YEAR(created_at) = ${prevYear} AND (status IN ('APPROVED','RECEIVING') OR status LIKE 'approved%')) +
            (SELECT COUNT(DISTINCT receiving_unit) FROM disbursements WHERE YEAR(expected_transfer_date) = ${prevYear} AND (status = 'COMPLETED' OR status LIKE 'hoan_thanh%'))
        ) as prev_total_beneficiaries
    `;

    const result = await this.programRepo.query(sqlKPI);
    const data = result[0];

    const currentBudget = Number(data.total_budget || 0);
    const prevBudget = Number(data.prev_total_budget || 0);
    const disbursedAmount = Number(data.disbursed_amount || 0);
    const totalPrograms = Number(data.total_programs || 0);
    const prevPrograms = Number(data.prev_total_programs || 0);
    const totalBeneficiaries = Number(data.total_beneficiaries || 0);
    const prevBeneficiaries = Number(data.prev_total_beneficiaries || 0);

    return {
      total_budget: currentBudget,
      total_budget_growth: prevBudget > 0 ? Number(((currentBudget - prevBudget) / prevBudget * 100).toFixed(2)) : 0,
      disbursed_amount: disbursedAmount,
      disbursed_rate: currentBudget > 0 ? Number((disbursedAmount / currentBudget * 100).toFixed(2)) : 0,
      total_programs: totalPrograms,
      new_programs: totalPrograms - prevPrograms > 0 ? totalPrograms - prevPrograms : 0,
      total_beneficiaries: totalBeneficiaries,
      beneficiaries_growth: prevBeneficiaries > 0 ? Number(((totalBeneficiaries - prevBeneficiaries) / prevBeneficiaries * 100).toFixed(2)) : 0
    };
  }

  /**
   * API 2: XU HƯỚNG GIẢI NGÂN THEO THÁNG
   */
  async getDisbursementTrend(query: DashboardQueryDto) {
    const year = query.year || new Date().getFullYear();
    
    const sql = `
      SELECT month, SUM(cash_amount) as cash_amount, SUM(in_kind_amount) as in_kind_amount, 
             SUM(education_amount) as education_amount, SUM(total_amount) as total_amount
      FROM (
        SELECT 
          MONTH(d.expected_transfer_date) as month,
          SUM(CASE WHEN p.funding_type IN ('Bổng tiền', 'Bang_tien', 'CASH', 'Bằng tiền') THEN dd.amount ELSE 0 END) as cash_amount,
          0 as in_kind_amount,
          SUM(CASE WHEN p.funding_type IN ('Giáo dục', 'Giao_duc', 'EDUCATION') THEN dd.amount ELSE 0 END) as education_amount,
          SUM(dd.amount) as total_amount
        FROM disbursement_details dd
        JOIN disbursements d ON d.id = dd.disbursement_id
        JOIN program_items pi ON pi.id = d.program_item_id
        JOIN programs p ON p.id = pi.program_id
        WHERE YEAR(d.expected_transfer_date) = ${year} AND d.status = 'COMPLETED'
        GROUP BY MONTH(d.expected_transfer_date)

        UNION ALL

        SELECT 
          MONTH(a.created_at) as month,
          0 as cash_amount,
          SUM(a.unit_price * a.quantity) as in_kind_amount,
          0 as education_amount,
          SUM(a.unit_price * a.quantity) as total_amount
        FROM assets a
        JOIN programs p ON p.id = a.program_id
        WHERE YEAR(a.created_at) = ${year} AND a.status IN ('PURCHASED','SHIPPING','DELIVERED')
        GROUP BY MONTH(a.created_at)
      ) trend_data
      GROUP BY month
      ORDER BY month ASC
    `;

    const rawData = await this.programRepo.query(sql);
    
    // Determine which months to return
    let startMonth = 1;
    let endMonth = 12;

    if (query.quarter && query.quarter !== 'Năm') {
      const qNum = parseInt(query.quarter.substring(1));
      startMonth = (qNum - 1) * 3 + 1;
      endMonth = qNum * 3;
    }

    // Ensure only relevant months are present
    const months = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => {
      const monthNum = startMonth + i;
      const monthData = rawData.find(d => d.month === monthNum);
      return {
        month: monthNum,
        cash_amount: Number(monthData?.cash_amount || 0),
        in_kind_amount: Number(monthData?.in_kind_amount || 0),
        education_amount: Number(monthData?.education_amount || 0),
        total_amount: Number(monthData?.total_amount || 0)
      };
    });

    return months;
  }

  /**
   * API 3: PHÂN BỔ THEO LOẠI HÌNH TÀI TRỢ
   */
  async getFundingDistribution(query: DashboardQueryDto) {
    const year = query.year || new Date().getFullYear();
    const { quarter } = query;
    let quarterFilter = '';
    if (quarter && quarter !== 'Năm') {
      quarterFilter = `AND DATEPART(QUARTER, p.start_date) = ${quarter.substring(1)}`;
    }

    const sql = `
      SELECT 
        p.funding_type,
        SUM(pi.unit_price * pi.quantity) as amount
      FROM programs p
      JOIN program_items pi ON pi.program_id = p.id
      WHERE YEAR(p.start_date) = ${year} AND p.status != 'CANCELLED' ${quarterFilter}
      GROUP BY p.funding_type
    `;

    const rawData = await this.programRepo.query(sql);
    const totalBudget = rawData.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const typeMapping = {
      'Bằng tiền': { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' },
      'Bổng tiền': { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' },
      'Bang_tien': { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' },
      'CASH': { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' },
      'Tài trợ tiền mặt': { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' },
      'Hiện vật': { type: 'IN_KIND', label: 'Bằng hiện vật', color: '#FF7A00' },
      'Hien_vat': { type: 'IN_KIND', label: 'Bằng hiện vật', color: '#FF7A00' },
      'IN_KIND': { type: 'IN_KIND', label: 'Bằng hiện vật', color: '#FF7A00' },
      'Giáo dục': { type: 'EDUCATION', label: 'Tài trợ giáo dục', color: '#7B5EA7' },
      'Giao_duc': { type: 'EDUCATION', label: 'Tài trợ giáo dục', color: '#7B5EA7' },
      'EDUCATION': { type: 'EDUCATION', label: 'Tài trợ giáo dục', color: '#7B5EA7' }
    };

    // Grouping logic to avoid duplicates (e.g., Bang_tien and CASH showing up separately)
    const groupedItems: Record<string, any> = {};

    rawData.forEach(d => {
      const rawType = (d.funding_type || '').trim();
      let mapping = typeMapping[rawType];
      
      // Flexible matching for variants not in dictionary
      if (!mapping) {
        if (rawType.toLowerCase().includes('tiền mặt') || rawType.toLowerCase().includes('cash') || rawType.toLowerCase().includes('bổng tiền')) {
          mapping = { type: 'CASH', label: 'Bằng tiền', color: '#00B96B' };
        } else if (rawType.toLowerCase().includes('hiện vật') || rawType.toLowerCase().includes('kind')) {
          mapping = { type: 'IN_KIND', label: 'Bằng hiện vật', color: '#FF7A00' };
        } else if (rawType.toLowerCase().includes('giáo dục') || rawType.toLowerCase().includes('education')) {
          mapping = { type: 'EDUCATION', label: 'Tài trợ giáo dục', color: '#7B5EA7' };
        } else {
          mapping = { type: 'OTHER', label: rawType || 'Khác', color: '#94A3B8' };
        }
      }

      const key = mapping.label;
      
      if (!groupedItems[key]) {
        groupedItems[key] = {
          funding_type: mapping.type,
          label: mapping.label,
          amount: 0,
          color: mapping.color
        };
      }
      groupedItems[key].amount += Number(d.amount);
    });

    const items = Object.values(groupedItems).map(item => ({
      ...item,
      percentage: totalBudget > 0 ? Number((item.amount / totalBudget * 100).toFixed(2)) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      total_budget: totalBudget,
      items
    };
  }

  /**
   * API 4: DANH SÁCH CHƯƠNG TRÌNH ASXH ĐANG TRIỂN KHAI
   */
  async getPrograms(query: DashboardQueryDto) {
    const year = query.year || new Date().getFullYear();
    const page = query.page || 1;
    const page_size = query.page_size || 5;
    const { status, funding_type, locality, quarter } = query;
    const skip = (page - 1) * page_size;

    let where = `WHERE YEAR(p.start_date) = ${year}`;
    if (status && status !== 'all') where += ` AND p.status = '${status}'`;
    if (funding_type && funding_type !== 'all') where += ` AND p.funding_type = '${funding_type}'`;
    if (locality) where += ` AND p.locality LIKE '%${locality}%'`;
    if (quarter && quarter !== 'Năm') {
      where += ` AND DATEPART(QUARTER, p.start_date) = ${quarter.substring(1)}`;
    }

    const sql = `
      SELECT p.id, p.name, p.funding_type, p.locality, p.status, p.created_at,
      (SELECT SUM(unit_price * quantity) FROM program_items WHERE program_id = p.id) as budget,
      (SELECT SUM(dd.amount) FROM disbursement_details dd 
       JOIN disbursements d ON d.id = dd.disbursement_id 
       JOIN program_items pi ON pi.id = d.program_item_id
       WHERE pi.program_id = p.id AND d.status = 'COMPLETED') as manual_disbursed_total,
      (SELECT SUM(a.unit_price * a.quantity) FROM assets a
       WHERE a.program_id = p.id AND a.status IN ('PURCHASED','SHIPPING','DELIVERED')) as asset_disbursed_total
      FROM programs p
      ${where}
      ORDER BY p.created_at DESC
      OFFSET ${skip} ROWS FETCH NEXT ${page_size} ROWS ONLY
    `;

    const sqlTotal = `SELECT COUNT(*) as total FROM programs p ${where}`;

    const [items, totalRes] = await Promise.all([
      this.programRepo.query(sql),
      this.programRepo.query(sqlTotal)
    ]);

    const mappedItems = items.map(p => {
      const budget = Number(p.budget || 0);
      const manual_disbursed = Number(p.manual_disbursed_total || 0);
      const asset_disbursed = Number(p.asset_disbursed_total || 0);
      const disbursed = manual_disbursed + asset_disbursed;
      
      // Normalize funding type
      let fType = 'OTHER';
      let fLabel = p.funding_type || 'Khác';
      if (['Bổng tiền', 'Bang_tien', 'CASH'].includes(p.funding_type)) {
        fType = 'CASH';
        fLabel = 'Chi tiền mặt';
      } else if (['Hiện vật', 'Hien_vat', 'IN_KIND'].includes(p.funding_type)) {
        fType = 'IN_KIND';
        fLabel = 'Hiện vật';
      } else if (['Giáo dục', 'Giao_duc', 'EDUCATION'].includes(p.funding_type)) {
        fType = 'EDUCATION';
        fLabel = 'Giáo dục';
      }

      // Normalize status
      let sLabel = 'Chuẩn bị';
      let sKey = 'PREPARING';
      const rawStatus = (p.status || '').toUpperCase();
      if (['ACTIVE', 'IN_PROGRESS', 'DANG_TRIEN_KHAI', 'TRIEN_KHAI'].includes(rawStatus)) {
        sLabel = 'Đang triển khai';
        sKey = 'ACTIVE';
      } else if (['COMPLETED', 'HOAN_THANH'].includes(rawStatus)) {
        sLabel = 'Hoàn thành';
        sKey = 'COMPLETED';
      } else if (['LAP_KE_HOACH', 'PLANNING', 'KE_HOACH'].includes(rawStatus)) {
        sLabel = 'Lập kế hoạch';
        sKey = 'PREPARING';
      }

      return {
        id: p.id,
        name: p.name,
        funding_type: fType,
        funding_type_label: fLabel,
        locality: p.locality,
        budget,
        disbursed,
        progress: budget > 0 ? Number(((disbursed / budget) * 100).toFixed(2)) : 0,
        status: sKey,
        status_label: sLabel
      };
    });

    return {
      total: Number(totalRes[0].total),
      page,
      page_size,
      items: mappedItems
    };
  }

  /**
   * API 6: SỰ KIỆN SẮP TỚI
   */
  async getUpcomingEvents(query: DashboardQueryDto) {
    const fromDate = query.from_date || new Date().toISOString().split('T')[0];
    const toDate = query.to_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = query.page_size || 5;

    const sql = `
      SELECT * FROM (
        SELECT pm.id, pm.milestone_date AS event_date, pm.milestone_name AS title, 
               'Milestone' as description, pm.milestone_type, p.id AS program_id, p.funding_type
        FROM program_milestones pm 
        JOIN programs p ON p.id = pm.program_id
        WHERE pm.milestone_date BETWEEN '${fromDate}' AND '${toDate}'
        
        UNION ALL
        
        SELECT ha.id, ha.handover_date AS event_date, ha.event_name AS title, 
               CONCAT(ha.start_time, ' - ', ha.end_time) AS description, 'HANDOVER' as milestone_type, 
               ha.program_id, p.funding_type
        FROM handover_assets ha
        JOIN programs p ON p.id = ha.program_id
        WHERE ha.handover_date BETWEEN '${fromDate}' AND '${toDate}'
      ) as events
      ORDER BY event_date ASC
      OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    // Wrapping in try-catch because handover_assets might not exist yet
    try {
      const rawEvents = await this.programRepo.query(sql);
      return {
        items: rawEvents.map(e => {
          const date = new Date(e.event_date);
          return {
            id: e.id,
            event_date: e.event_date,
            day: date.getDate(),
            month: date.getMonth() + 1,
            title: e.title,
            description: e.description ? e.description.toString().replace(/\.\d+/g, '') : '',
            event_type: e.milestone_type,
            badge_label: ['Bằng tiền', 'Bổng tiền', 'CASH', 'Bang_tien', 'Tài trợ tiền mặt'].some(v => e.funding_type?.includes(v)) ? 'Tiền' : (e.funding_type?.includes('Giáo dục') || e.funding_type?.includes('EDUCATION')) ? 'GD' : 'HV',
            badge_color: ['Bằng tiền', 'Bổng tiền', 'CASH', 'Bang_tien', 'Tài trợ tiền mặt'].some(v => e.funding_type?.includes(v)) ? '#00B96B' : (e.funding_type?.includes('Giáo dục') || e.funding_type?.includes('EDUCATION')) ? '#7B5EA7' : '#FF7A00',
            program_id: e.program_id
          };
        })
      };
    } catch (error) {
      this.logger.warn("HandoverAssets or other tables might be missing, returning fallback milestones only.");
      // Fallback to only milestones if UNION fails
      const fallbackSql = `
        SELECT pm.id, pm.milestone_date AS event_date, pm.milestone_name AS title, 
               'Milestone' as description, pm.milestone_type, p.id AS program_id, p.funding_type
        FROM program_milestones pm 
        JOIN programs p ON p.id = pm.program_id
        WHERE pm.milestone_date BETWEEN '${fromDate}' AND '${toDate}'
        ORDER BY event_date ASC
        OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY
      `;
      const rawEvents = await this.programRepo.query(fallbackSql);
      return {
        items: rawEvents.map(e => {
          const date = new Date(e.event_date);
          return {
            id: e.id,
            event_date: e.event_date,
            day: date.getDate(),
            month: date.getMonth() + 1,
            title: e.title,
            description: e.description ? e.description.toString().replace(/\.\d+/g, '') : '',
            event_type: e.milestone_type,
            badge_label: ['Bằng tiền', 'Bổng tiền', 'CASH', 'Bang_tien', 'Tài trợ tiền mặt'].some(v => e.funding_type?.includes(v)) ? 'Tiền' : (e.funding_type?.includes('Giáo dục') || e.funding_type?.includes('EDUCATION')) ? 'GD' : 'HV',
            badge_color: ['Bằng tiền', 'Bổng tiền', 'CASH', 'Bang_tien', 'Tài trợ tiền mặt'].some(v => e.funding_type?.includes(v)) ? '#00B96B' : (e.funding_type?.includes('Giáo dục') || e.funding_type?.includes('EDUCATION')) ? '#7B5EA7' : '#FF7A00',
            program_id: e.program_id
          };
        })
      };
    }
  }

  /**
   * API 7: PHÂN BỔ NGÂN SÁCH THEO KHU VỰC (TOP 5)
   */
  async getLocalityDistribution(query: DashboardQueryDto) {
    const year = query.year || new Date().getFullYear();
    const { quarter } = query;
    let quarterFilter = '';
    if (quarter && quarter !== 'Năm') {
      quarterFilter = `AND DATEPART(QUARTER, p.start_date) = ${quarter.substring(1)}`;
    }

    const sql = `
      SELECT 
        p.locality as name,
        SUM(pi.unit_price * pi.quantity) as value
      FROM programs p
      JOIN program_items pi ON pi.program_id = p.id
      WHERE YEAR(p.start_date) = ${year} AND p.status != 'CANCELLED' ${quarterFilter}
      GROUP BY p.locality
      ORDER BY value DESC
      OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
    `;

    const rawData = await this.programRepo.query(sql);
    return rawData.map(d => ({
      name: d.name || 'Khác',
      value: Number(d.value || 0)
    }));
  }
}
