import { Injectable, NotFoundException, OnModuleInit, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoriesEntity } from '../entities/inventories.entity';
import { InventoryTransactionEntity, InventoryTransactionItemEntity, InventoryTransactionLogEntity } from '../entities/inventory-transaction.entity';
import { GoodsReceiptEntity } from '../entities/goods-receipt.entity';
import { InventoryFilterDto, ImportInventoryDto, CreateIssueRequestDto } from '../dto/inventory.dto';
import { AuditService } from './audit.service';
import { UserEntity } from 'src/users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { GoodsIssueFilterDto } from '../dto/inventory.dto';

import { ProductLimitEntity } from '../entities/product-limit.entity';

@Injectable()
export class VppInventoryService implements OnModuleInit {
  constructor(
    @InjectRepository(InventoriesEntity, 'mssqlConnection')
    private readonly inventoryRepo: Repository<InventoriesEntity>,
    @InjectRepository(ProductEntity, 'mssqlConnection')
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(InventoryTransactionEntity, 'mssqlConnection')
    private readonly transactionRepo: Repository<InventoryTransactionEntity>,
    @InjectRepository(ProductLimitEntity, 'mssqlConnection')
    private readonly limitRepo: Repository<ProductLimitEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit() {
    try {
      console.log('[VppInventoryService] Checking database tables structure...');

      // 1. Check ProductLimit
      await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProductLimit') AND name = 'organization_unit_id')
        BEGIN
          ALTER TABLE ProductLimit ADD organization_unit_id NVARCHAR(255) NULL;
        END
      `);

      // 2. Check GoodsIssue (Table for Screen 3/4)
      await this.dataSource.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('GoodsIssue') AND type in ('U'))
        BEGIN
          CREATE TABLE GoodsIssue (
            id INT IDENTITY(1,1) PRIMARY KEY,
            transaction_id INT NOT NULL,
            receiver_id NVARCHAR(100) NULL,
            priority NVARCHAR(50) NULL,
            needed_date DATETIME NULL,
            reason NVARCHAR(MAX) NULL,
            department NVARCHAR(255) NULL,
            signature NVARCHAR(MAX) NULL,
            status INT NULL,
            approver NVARCHAR(100) NULL,
            requester_name NVARCHAR(255) NULL,
            requester_username NVARCHAR(100) NULL,
            requester_id NVARCHAR(100) NULL,
            created_at DATETIME DEFAULT GETDATE()
          );
        END
        ELSE
        BEGIN
          -- Ensure columns exist if table exists
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'department')
            ALTER TABLE GoodsIssue ADD department NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'signature')
            ALTER TABLE GoodsIssue ADD signature NVARCHAR(MAX) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'status')
            ALTER TABLE GoodsIssue ADD status INT NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'approver')
            ALTER TABLE GoodsIssue ADD approver NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'requester_name')
            ALTER TABLE GoodsIssue ADD requester_name NVARCHAR(255) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'requester_username')
            ALTER TABLE GoodsIssue ADD requester_username NVARCHAR(100) NULL;
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GoodsIssue') AND name = 'requester_id')
            ALTER TABLE GoodsIssue ADD requester_id NVARCHAR(100) NULL;
        END
      `);

      console.log('[VppInventoryService] Database structure sync completed.');
    } catch (error) {
      console.error('[VppInventoryService] Error syncing database structure:', error);
    }
  }

  async findInventory(filter: InventoryFilterDto) {
    const { keyword, category, stockStatus } = filter;
    const page = filter.page ? Number(filter.page) : 1;
    const limit = filter.limit ? Number(filter.limit) : 20;
    const skip = (page - 1) * limit;

    const query = this.productRepo.createQueryBuilder('p')
      .leftJoin('(SELECT product_id, MAX(quantity) as quantity, MAX(min_stock) as min_stock, MAX(max_stock) as max_stock, MAX(updated_at) as updated_at FROM Inventories GROUP BY product_id)', 'i', 'i.product_id = p.id')
      .select([
        'p.id as id',
        'p.code as product_code',
        'p.name as product_name',
        'p.category as category',
        'p.unit as unit',
        'p.status as status',
        'i.quantity as quantity',
        'i.min_stock as min_stock',
        'i.max_stock as max_stock',
        'i.updated_at as updated_at',
        // Subqueries to get last transaction info
        `(SELECT TOP 1 it.transaction_type 
          FROM InventoryTransaction it 
          JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id 
          WHERE iti.product_id = p.id 
          ORDER BY it.created_at DESC) as transaction_type`,
        `(SELECT TOP 1 iti.actual_quantity 
          FROM InventoryTransaction it 
          JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id 
          WHERE iti.product_id = p.id 
          ORDER BY it.created_at DESC) as actual_quantity`,
        `(SELECT TOP 1 it.created_at 
          FROM InventoryTransaction it 
          JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id 
          WHERE iti.product_id = p.id 
          ORDER BY it.created_at DESC) as created_at`,
        `(SELECT TOP 1 gr.supplier 
          FROM InventoryTransaction it 
          JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id 
          LEFT JOIN GoodsReceipt gr ON gr.transaction_id = it.id
          WHERE iti.product_id = p.id 
          ORDER BY it.created_at DESC) as supplier`
      ]);

    if (keyword) {
      query.andWhere('(p.name COLLATE Latin1_General_CI_AI LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (category) {
      query.andWhere('p.category = :category', { category });
    }

    // Filter by stockStatus in SQL
    if (stockStatus === 'OUT') {
      query.andWhere('(i.quantity IS NULL OR i.quantity = 0)');
    } else if (stockStatus === 'LOW') {
      query.andWhere('i.quantity > 0 AND i.quantity < 30');
    } else if (stockStatus === 'ENOUGH') {
      query.andWhere('i.quantity >= 30');
    }

    const rawItems = await query
      .orderBy('p.id', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    // Tính stockStatus và Filter

    const processedItems = rawItems.map(i => {

      let status = 'ENOUGH';
      const qty = Number(i.quantity || 0);
      if (qty === 0) status = 'OUT';
      else if (qty < 30) status = 'LOW';

      return {
        ...i,
        min_stock: 30, // Đồng bộ với ngưỡng sắp hết người dùng yêu cầu
        stock_status: status,
        last_transaction_type: i.transaction_type || '---',
        last_transaction_quantity: i.actual_quantity || 0,
        last_transaction_date: i.created_at || null,
        last_transaction_supplier: i.supplier || '---',
      };
    });

    // Summary stats
    const summary = await this.dataSource.query(`
      SELECT 
        ISNULL(COUNT(*), 0) as total_items,
        ISNULL(SUM(CASE WHEN ISNULL(i.quantity, 0) = 0 THEN 1 ELSE 0 END), 0) as out_of_stock,
        ISNULL(SUM(CASE WHEN ISNULL(i.quantity, 0) > 0 AND ISNULL(i.quantity, 0) < 30 THEN 1 ELSE 0 END), 0) as low_stock,
        ISNULL(SUM(CASE WHEN ISNULL(i.quantity, 0) >= 30 THEN 1 ELSE 0 END), 0) as enough_stock,
        ISNULL(SUM(ISNULL(i.quantity, 0) * p.reference_price), 0) as total_value
      FROM Product p
      LEFT JOIN (SELECT product_id, MAX(quantity) as quantity FROM Inventories GROUP BY product_id) i ON i.product_id = p.id
      WHERE (p.name LIKE @0 OR p.code LIKE @0)
      AND (@1 IS NULL OR p.category = @1)
    `, [`%${keyword || ''}%`, category || null]);

    // totalRes must also consider stockStatus if present
    const totalQuery = this.productRepo.createQueryBuilder('p')
      .leftJoin('(SELECT product_id, MAX(quantity) as quantity FROM Inventories GROUP BY product_id)', 'i', 'i.product_id = p.id')
      .where(keyword ? '(p.name LIKE :keyword OR p.code LIKE :keyword)' : '1=1', { keyword: `%${keyword}%` })
      .andWhere(category ? 'p.category = :category' : '1=1', { category });

    if (stockStatus === 'OUT') {
      totalQuery.andWhere('(i.quantity IS NULL OR i.quantity = 0)');
    } else if (stockStatus === 'LOW') {
      totalQuery.andWhere('i.quantity > 0 AND i.quantity < 30');
    } else if (stockStatus === 'ENOUGH') {
      totalQuery.andWhere('i.quantity >= 30');
    }
    const totalRes = await totalQuery.getCount();

    return {
      success: true,
      data: {
        total: totalRes,
        page,
        size: limit,
        items: processedItems,
        summary: summary[0] || {
          total_items: 0,
          out_of_stock: 0,
          low_stock: 0,
          enough_stock: 0,
          total_value: 0
        }
      }
    };
  }

  async getDetail(productId: number) {
    const inventory = await this.inventoryRepo.findOne({
      where: { productId },
      relations: ['product']
    });
    if (!inventory) throw new NotFoundException('Không tìm thấy thông tin tồn kho cho mặt hàng này');

    const transactions = await this.dataSource.query(`
      SELECT it.id, it.transaction_code as transactionCode, it.transaction_type as transactionType, 
             iti.actual_quantity as quantity, it.created_at as transactionDate,
             gr.supplier, iti.unit_price as unitPrice
      FROM InventoryTransaction it
      JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
      LEFT JOIN GoodsReceipt gr ON gr.transaction_id = it.id
      WHERE iti.product_id = @0
      ORDER BY it.created_at DESC
    `, [productId]);

    let status = 'ENOUGH';
    if (Number(inventory.quantity) === 0) status = 'OUT';
    else if (Number(inventory.quantity) < 30) status = 'LOW';

    return {
      success: true,
      data: {
        productId: inventory.product.id,
        productCode: inventory.product.code,
        productName: inventory.product.name,
        category: inventory.product.category,
        quantity: inventory.quantity,
        unit: inventory.product.unit,
        minStock: 30, // Đồng bộ ngưỡng 30
        maxStock: inventory.max_stock,
        stockStatus: status,
        transactions,
        totalTransactions: transactions.length
      }
    };
  }

  async importStock(dto: ImportInventoryDto, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(ProductEntity, { where: { id: dto.productId } });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

      // 1. Create Transaction
      const transCode = `NK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const transaction = queryRunner.manager.create(InventoryTransactionEntity, {
        transaction_code: transCode,
        transaction_type: 'RECEIPT',
        status: 'completed',
        createdById: userId,
        created_at: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      });
      const savedTrans = await queryRunner.manager.save(transaction);

      // 2. Create Item
      const item = queryRunner.manager.create(InventoryTransactionItemEntity, {
        transactionId: savedTrans.id,
        productId: dto.productId,
        actual_quantity: dto.quantity,
        requested_quantity: dto.quantity,
        unit_price: dto.unitPrice || 0,
        note: dto.note,
      });
      await queryRunner.manager.save(item);

      // 3. Create GoodsReceipt
      const receipt = queryRunner.manager.create(GoodsReceiptEntity, {
        transactionId: savedTrans.id,
        supplier: dto.supplier,
        invoice_number: dto.invoiceNo,
        note: dto.note,
      });
      await queryRunner.manager.save(receipt);

      // 4. Update Inventories
      let inventory = await queryRunner.manager.findOne(InventoriesEntity, { where: { productId: dto.productId } });
      const MAX_TOTAL_QUANTITY = 500;
      const currentQuantity = inventory ? Number(inventory.quantity) : 0;
      const newTotalQuantity = currentQuantity + Number(dto.quantity);

      if (newTotalQuantity > MAX_TOTAL_QUANTITY) {
        throw new BadRequestException(`Tổng tồn kho tối đa cho mặt hàng này không được vượt quá 500 sản phẩm. Hiện tại đang có ${currentQuantity}, bạn chỉ có thể nhập thêm tối đa ${MAX_TOTAL_QUANTITY - currentQuantity}.`);
      }

      if (inventory) {
        inventory.quantity = newTotalQuantity;
        await queryRunner.manager.save(inventory);
      } else {
        inventory = queryRunner.manager.create(InventoriesEntity, {
          productId: dto.productId,
          quantity: dto.quantity,
        });
        await queryRunner.manager.save(inventory);
      }

      // 5. Audit Log
      await this.auditService.log(userId, 'IMPORT_STOCK', `Nhập kho ${dto.quantity} ${product.unit} cho ${product.code}`, 'POST');

      // 6. Transaction Log
      const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
        transactionId: savedTrans.id,
        action_type: 'COMPLETED',
        status: 'completed',
        senderId: userId,
        note: 'Hệ thống tự động hoàn tất phiếu nhập kho',
      });
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();

      return {
        success: true,
        data: {
          transactionId: savedTrans.id,
          transactionCode: transCode,
          productId: dto.productId,
          quantity: dto.quantity,
          newQuantity: inventory.quantity,
          transactionDate: dto.transactionDate,
          createdAt: new Date(),
        }
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- MÀN 3: TẠO PHIẾU ĐỀ NGHỊ ---

  async getRequestorInfo(userId: string) {
    const user = await this.dataSource.query(`
      SELECT u.id, u.name as fullName, u.username, u.position,
             ou.id as departmentId, ou.name as departmentName,
             u.code_nd as employeeCode
      FROM users u
      LEFT JOIN organization_units ou ON ou.id = u.parent
      WHERE u.id = @0
    `, [userId]);

    if (!user.length) throw new NotFoundException('Không tìm thấy người dùng');

    // Thống kê số phiếu trong tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = await this.transactionRepo.createQueryBuilder('t')
      .where('t.createdById = :userId', { userId })
      .andWhere('t.transaction_type = :type', { type: 'ISSUE_REQUEST' })
      .andWhere('t.created_at >= :start', { start: startOfMonth })
      .getCount();

    return {
      success: true,
      data: {
        ...user[0],
        requestStats: stats
      }
    };
  }

  async getInventoryForPicker(userId: string, filter: any) {
    console.log('[VppInventoryService] getInventoryForPicker - userId:', userId, 'filter:', filter);
    // 1. Lấy thông tin phòng ban của user
    const user = await this.dataSource.query(`SELECT parent as deptId FROM users WHERE id = @0`, [userId]);
    const deptId = user[0]?.deptId;
    console.log('[VppInventoryService] getInventoryForPicker - deptId:', deptId);

    const { keyword, category } = filter;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {
      // 2. Query sản phẩm kèm tồn kho và định mức
      // Logic định mức: Ưu tiên User Limit, sau đó đến Dept Limit
      const query = this.productRepo.createQueryBuilder('p')
        .leftJoin(InventoriesEntity, 'i', 'i.product_id = p.id')
        .select([
          'p.id as id',
          'p.code as code',
          'p.name as name',
          'p.category as category',
          'p.unit as unit',
          'p.reference_price as price',
          'p.quotaValue as quotaValue',
          'p.quotaUnit as quotaUnit',
          'ISNULL(i.quantity, 0) as stock',
        ]);

      if (keyword) {
        query.andWhere('(p.name COLLATE Latin1_General_CI_AI LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
      }
      if (category) {
        query.andWhere('p.category = :category', { category });
      }

      const items = await query.getRawMany();

      // 3. Tính số lượng đã dùng trong tháng này cho từng sản phẩm
      const usedQtys = await this.dataSource.query(`
        SELECT iti.product_id, SUM(iti.requested_quantity) as used
        FROM InventoryTransaction it
        JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
        WHERE it.created_by = @0
        AND it.transaction_type IN ('ISSUE_REQUEST', 'ISSUE')
        AND it.status NOT IN ('REJECTED', 'CANCELLED')
        AND MONTH(it.created_at) = @1
        AND YEAR(it.created_at) = @2
        GROUP BY iti.product_id
      `, [userId, month, year]);

      const usedMap = new Map(usedQtys.map((u: any) => [u.product_id, Number(u.used)]));

      const processedItems = items.map(item => {
        const used = (usedMap.get(item.id) as number) || 0;
        const limit = Number(item.quotaValue || 0);
        return {
          ...item,
          stock: Number(item.stock),
          quota: limit,
          quotaUnit: item.quotaUnit || 'Tháng',
          used: used,
          remaining: limit > 0 ? Math.max(0, limit - used) : 0,
          isOverLimit: limit > 0 && used >= limit
        };
      });

      return {
        success: true,
        data: processedItems
      };
    } catch (err) {
      console.error('[VppInventoryService] getInventoryForPicker Error:', err);
      throw err;
    }
  }

  async checkLimit(productIds: string, userId: string) {
    if (!productIds) {
      throw new BadRequestException('Tham số product_ids không hợp lệ');
    }
    const ids = productIds.split(',').map(id => Number(id.trim()));

    const user = await this.dataSource.query(`SELECT parent as deptId FROM users WHERE id = @0`, [userId]);
    const deptId = user[0]?.deptId;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const results: any[] = [];
    for (const id of ids) {
      const product = await this.productRepo.findOne({
        where: { id },
        select: ['id', 'quotaValue', 'quotaUnit']
      });

      const usedRaw = await this.dataSource.query(`
        SELECT ISNULL(SUM(iti.requested_quantity), 0) as used
        FROM InventoryTransaction it
        JOIN InventoryTransaction_Item iti ON iti.transaction_id = it.id
        WHERE it.created_by = @0
        AND iti.product_id = @1
        AND it.transaction_type IN ('ISSUE_REQUEST', 'ISSUE')
        AND it.status NOT IN ('REJECTED', 'CANCELLED')
        AND MONTH(it.created_at) = @2
        AND YEAR(it.created_at) = @3
      `, [userId, id, month, year]);

      const limit = Number(product?.quotaValue || 0);
      const used = Number(usedRaw[0]?.used || 0);

      results.push({
        product_id: id,
        quantity_limit: limit,
        quotaUnit: product?.quotaUnit || 'Tháng',
        used_quantity: used,
        remaining: limit > 0 ? Math.max(0, limit - used) : 0,
        is_over_limit: limit > 0 && used >= limit
      });
    }

    return { success: true, data: results };
  }

  async createIssueRequest(dto: CreateIssueRequestDto, userId: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Danh sách sản phẩm không được rỗng');
      }

      // 1. Transaction Code
      const transCode = dto.code || `DN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const status = dto.action === 'SUBMIT' ? 'PENDING_APPROVAL' : 'DRAFT';

      // Using provided requester_id or current user
      const effectiveRequesterId = dto.requester_id || userId;

      const transaction = queryRunner.manager.create(InventoryTransactionEntity, {
        transaction_code: transCode,
        transaction_type: 'ISSUE_REQUEST',
        status: status,
        createdById: effectiveRequesterId,
      });
      const savedTrans = await queryRunner.manager.save(transaction);

      // 2. Xử lý field signature (base64)
      let signatureUrl: string | null = null;
      if (dto.signature && dto.signature.startsWith('data:image')) {
        signatureUrl = await this.processSignatureBase64(dto.signature, queryRunner, effectiveRequesterId);
      } else if (dto.signature) {
        signatureUrl = dto.signature;
      }

      // 3. GoodsIssue
      await queryRunner.manager.query(`
        INSERT INTO GoodsIssue (transaction_id, receiver_id, priority, needed_date, reason, department, signature, status, approver, requester_name, requester_username, requester_id)
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11)
      `, [
        savedTrans.id,
        effectiveRequesterId,
        dto.priority,
        dto.need_date,
        dto.reason,
        dto.department || null,
        signatureUrl,
        dto.status !== undefined ? dto.status : (dto.action === 'SUBMIT' ? 2 : 1),
        dto.approver || null,
        dto.requester_name || null,
        dto.requester_username || null,
        effectiveRequesterId
      ]);

      // 4. Items
      for (const reqItem of dto.items) {
        if (reqItem.requested_quantity <= 0) {
          throw new BadRequestException(`Số lượng yêu cầu cho sản phẩm ID ${reqItem.product_id} phải lớn hơn 0`);
        }

        // Validate stock
        const inventory = await queryRunner.manager.findOne(InventoriesEntity, { where: { productId: reqItem.product_id } });
        const currentStock = inventory ? Number(inventory.quantity) : 0;
        if (reqItem.requested_quantity > currentStock) {
          const productName = (reqItem as any).product_name || `ID ${reqItem.product_id}`;
          throw new BadRequestException(`Số lượng yêu cầu cho sản phẩm ${productName} (${reqItem.requested_quantity}) vượt quá tồn kho hiện tại (${currentStock})`);
        }

        // Use price from frontend if provided, otherwise fallback to catalog
        let unitPrice = (reqItem as any).unit_price;
        if (!unitPrice) {
          const product = await queryRunner.manager.findOne(ProductEntity, { where: { id: reqItem.product_id } });
          unitPrice = product?.reference_price || 0;
        }

        const item = queryRunner.manager.create(InventoryTransactionItemEntity, {
          transactionId: savedTrans.id,
          productId: reqItem.product_id,
          requested_quantity: reqItem.requested_quantity,
          actual_quantity: 0, // Sẽ cập nhật khi duyệt
          note: reqItem.note,
          unit_price: unitPrice,
        });
        await queryRunner.manager.save(item);
      }

      // 5. System Log (InventoryTransaction_Log)
      const actionType = dto.action === 'DRAFT' ? 'CREATE' : 'SUBMIT';
      const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
        transactionId: savedTrans.id,
        action_type: actionType,
        status: status,
        senderId: userId, // log the person who physically made the request (original requester or admin)
        approvalId: dto.approver || undefined,
        note: `Tạo phiếu đề nghị cấp VPP cho ${dto.requester_name || effectiveRequesterId}`,
        ip: ip || 'unknown',
        resource: resource || 'createIssueRequest'
      } as any);
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Tạo phiếu thành công',
        data: {
          id: savedTrans.id,
          transaction_code: transCode,
          status: status,
          created_at: savedTrans.created_at,
          signature_url: signatureUrl
        }
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Helper xử lý base64 chữ ký
  private async processSignatureBase64(base64Data: string, queryRunner: any, userId: string): Promise<string | null> {
    try {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return null;
      }
      const type = matches[1];
      const data = Buffer.from(matches[2], 'base64');
      const ext = type.split('/')[1] || 'png';
      const fileName = `signature_${Date.now()}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'upload', 'TCSG', 'VPP');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePathLocal = path.join(uploadDir, fileName);
      fs.writeFileSync(filePathLocal, data);

      // Sử dụng MSSQL Pool chung với module FilesManagement để đảm bảo lưu đúng database
      const { getMssqlPool } = require('../../database/mssql.pool');
      const mssqlPool = await getMssqlPool(this.configService);
      const request = mssqlPool.request();
      request.input('file_name', fileName);
      request.input('file_path', `TCSG/VPP/${fileName}`);
      request.input('mime_type', type);
      request.input('file_size', data.length);
      request.input('created_by', userId);
      request.input('storage_type', 'local');
      request.input('storage_path', `TCSG/VPP/${fileName}`);

      const fileResult = await request.query(`
        INSERT INTO files (file_name, file_path, mime_type, file_size, created_by, storage_type, storage_path, is_directory, status)
        OUTPUT INSERTED.id
        VALUES (@file_name, @file_path, @mime_type, @file_size, @created_by, @storage_type, @storage_path, 0, 1)
      `);

      const fileId = fileResult.recordset[0].id;

      // Log debug để kiểm tra xem file đã thực sự nằm trong DB chưa
      const debugCheck = await mssqlPool.request().query(`SELECT * FROM files WHERE id = ${fileId}`);
      console.log(`[VppInventoryService] Created file ID: ${fileId}`, debugCheck.recordset[0]);

      return `/api/files/view/${fileId}`;
    } catch (e) {
      console.error("Base64 processing error:", e);
      return null;
    }
  }

  // --- MÀN 4: LẤY DANH SÁCH ---
  async getGoodsIssues(filter: GoodsIssueFilterDto, userId: string) {
    const page = filter.page ? Number(filter.page) : 1;
    const limit = filter.limit ? Number(filter.limit) : 15;
    const skip = (page - 1) * limit;

    // Fetch actual user info to handle both ID and Username matches early
    // Using CAST to NVARCHAR to prevent conversion errors if userId is not a valid UUID
    const userDetail = await this.dataSource.query(
      `SELECT CAST(id AS NVARCHAR(36)) as id, username FROM users WHERE username = @0 OR CAST(id AS NVARCHAR(36)) = @0`,
      [userId]
    ).catch(() => []);

    const trueUserId = userDetail[0]?.id || userId;
    const trueUsername = userDetail[0]?.username || null;

    const roleInfo = await this.usersService.findProcessRoleInfoById(trueUserId);
    const staticPermissions = roleInfo?.staticPermissions || [];
    let isFullAdmin = staticPermissions.some(p => p.code === 'admin_vpp');

    // Check if user is a reviewer in VPP workflow
    let isReviewer = false;
    if (!isFullAdmin) {
      const approverCheck = await this.dataSource.query(`
        SELECT TOP 1 1 
        FROM WorkflowStep ws
        INNER JOIN Workflow w ON ws.workflow_id = w.id
        WHERE w.module_type = 'VPP' AND w.status = 'ACTIVE'
        AND (CAST(ws.approver_id AS NVARCHAR(36)) = @0 OR ws.username = @1)
      `, [trueUserId, trueUsername]).catch(() => []);
      if (approverCheck && approverCheck.length > 0) {
        isReviewer = true;
      }
    }

    const isAdminVisible = isFullAdmin || isReviewer;

    // 2. Xây dựng Query
    const whereClauses = ["it.transaction_type IN ('ISSUE_REQUEST', 'ISSUE')"];
    const params: any[] = [];

    // Use indices for clarity
    params.push(trueUserId);
    const userIdIdx = params.length - 1;

    let usernameIdx = -1;
    if (trueUsername) {
      params.push(trueUsername);
      usernameIdx = params.length - 1;
    }

    // Base visibility filter: Creator or Requester can ALWAYS see their own stuff
    // Cast to NVARCHAR(36) to safely compare with the parameter string
    const ownStuffClause = trueUsername
      ? `(CAST(it.created_by AS NVARCHAR(36)) = @${userIdIdx} OR CAST(gi.requester_id AS NVARCHAR(36)) = @${userIdIdx} OR gi.requester_username = @${usernameIdx})`
      : `(CAST(it.created_by AS NVARCHAR(36)) = @${userIdIdx} OR CAST(gi.requester_id AS NVARCHAR(36)) = @${userIdIdx})`;

    // Logic: Draft and Rejected requests should ONLY be visible to the creator/requester.
    const othersVisibleClause = `(UPPER(it.status) NOT IN ('DRAFT', 'REJECTED'))`;

    if (!isAdminVisible) {
      // Regular user: see own stuff OR stuff they are the approver of (but only if NOT DRAFT/REJECTED)
      whereClauses.push(`(${ownStuffClause} OR (CAST(gi.approver AS NVARCHAR(36)) = @${userIdIdx} AND ${othersVisibleClause}))`);
    } else {
      // Admin/Reviewer: see own stuff OR (others' requests that are NOT DRAFT/REJECTED)
      whereClauses.push(`(${ownStuffClause} OR ${othersVisibleClause})`);
    }

    if (filter.keyword) {
      params.push(`%${filter.keyword}%`);
      const idx = params.length - 1;
      whereClauses.push(`(it.transaction_code LIKE @${idx} OR gi.requester_name LIKE @${idx} OR gi.department LIKE @${idx})`);
    }

    // Only apply requester/approver filters if the user is NOT an admin/reviewer,
    // OR if they are an admin/reviewer but specifically filtering for SOMEONE ELSE.
    const filterRequesterId = filter.requester_id;
    const filterApproverId = filter.approver;

    const isFilteringSelf = (String(filterRequesterId) === String(trueUserId) || String(filterApproverId) === String(trueUserId));

    if (!isAdminVisible || !isFilteringSelf) {
      if (filterRequesterId && filterApproverId) {
        params.push(filterRequesterId);
        const reqIdIdx = params.length - 1;
        params.push(filterApproverId);
        const appIdIdx = params.length - 1;
        whereClauses.push(`((CAST(gi.requester_id AS NVARCHAR(36)) = @${reqIdIdx} OR CAST(it.created_by AS NVARCHAR(36)) = @${reqIdIdx}) OR CAST(gi.approver AS NVARCHAR(36)) = @${appIdIdx})`);
      } else {
        if (filterRequesterId) {
          params.push(filterRequesterId);
          const idx = params.length - 1;
          whereClauses.push(`(CAST(gi.requester_id AS NVARCHAR(36)) = @${idx} OR CAST(it.created_by AS NVARCHAR(36)) = @${idx})`);
        }
        if (filterApproverId) {
          params.push(filterApproverId);
          whereClauses.push(`CAST(gi.approver AS NVARCHAR(36)) = @${params.length - 1}`);
        }
      }
    }

    if (filter.department && filter.department !== 'all') {
      params.push(filter.department);
      whereClauses.push(`gi.department = @${params.length - 1}`);
    }

    if (filter.priority && filter.priority !== 'all') {
      params.push(filter.priority);
      whereClauses.push(`gi.priority = @${params.length - 1}`);
    }

    if (filter.fromDate) {
      params.push(`${filter.fromDate} 00:00:00`);
      whereClauses.push(`it.created_at >= @${params.length - 1}`);
    }

    if (filter.toDate) {
      params.push(`${filter.toDate} 23:59:59`);
      whereClauses.push(`it.created_at <= @${params.length - 1}`);
    }

    // Now build whereClausesFull including status
    const whereClausesFull = [...whereClauses];
    if (filter.status && filter.status !== 'all') {
      const statusUpper = filter.status.toUpperCase();
      if (statusUpper === 'PENDING' || statusUpper === 'PENDING_APPROVAL') {
        whereClausesFull.push(`(UPPER(it.status) LIKE 'PENDING%' OR UPPER(it.status) = 'PARTIAL')`);
      } else if (statusUpper === 'FINISHED' || statusUpper === 'COMPLETED') {
        // Chỉ lấy những phiếu hoàn tất THỰC SỰ (đã cấp đủ hoặc cố tình kết thúc)
        // Nhưng theo yêu cầu mới, tab Hoàn tất có thể chỉ giữ lại những phiếu cấp đủ? 
        // Tuy nhiên thường tab Hoàn tất vẫn hiện tất cả đã xong. 
        // Để đơn giản, ta giữ nguyên tab Hoàn tất hiện tất cả FINISHED.
        whereClausesFull.push(`UPPER(it.status) IN ('FINISHED', 'COMPLETED')`);
      } else if (statusUpper === 'PARTIAL') {
        // Lấy phiếu PARTIAL HOẶC phiếu FINISHED nhưng cấp thiếu
        whereClausesFull.push(`(UPPER(it.status) = 'PARTIAL' OR (UPPER(it.status) IN ('FINISHED', 'COMPLETED') AND 
          (SELECT ISNULL(SUM(actual_quantity), 0) FROM InventoryTransaction_Item WHERE transaction_id = it.id) < 
          (SELECT ISNULL(SUM(requested_quantity), 0) FROM InventoryTransaction_Item WHERE transaction_id = it.id)
        ))`);
      } else {
        params.push(statusUpper);
        whereClausesFull.push(`UPPER(it.status) = @${params.length - 1}`);
      }
    }

    const whereSql = whereClausesFull.length > 0 ? `WHERE ${whereClausesFull.join(' AND ')}` : '';
    const summaryWhereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        it.id as id, 
        it.transaction_code as request_number, 
        ISNULL(gi.requester_name, ISNULL(u.FullName, u.name)) as requester_name, 
        ISNULL(gi.requester_username, u.username) as requester_username,
        gi.requester_id,
        ISNULL(gi.department, ou.name) as department_name,
        it.created_at, 
        it.status, 
        gi.status as approval_status,
        gi.approver,
        gi.reviewer_id,
        gi.reject_id,
        gi.priority,
        gi.needed_date as need_date,
        gi.reason,
        gi.signature,
        (SELECT COUNT(*) FROM InventoryTransaction_Item WHERE transaction_id = it.id) as total_items,
        (SELECT ISNULL(SUM(ti.requested_quantity), 0) FROM InventoryTransaction_Item ti WHERE ti.transaction_id = it.id) as total_requested,
        (SELECT ISNULL(SUM(ti.actual_quantity), 0) FROM InventoryTransaction_Item ti WHERE ti.transaction_id = it.id) as total_actual,
        (SELECT ISNULL(SUM(
           CASE WHEN ISNULL(ti.actual_quantity, 0) > 0 THEN ti.actual_quantity ELSE ti.requested_quantity END
           * ISNULL(NULLIF(ti.unit_price, 0), p.reference_price)
         ), 0) 
         FROM InventoryTransaction_Item ti 
         JOIN Product p ON p.id = ti.product_id 
         WHERE ti.transaction_id = it.id) as estimated_value
      FROM InventoryTransaction it
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON CAST(u.id AS NVARCHAR(36)) = CAST(gi.receiver_id AS NVARCHAR(36))
      LEFT JOIN organization_units ou ON CAST(ou.id AS NVARCHAR(36)) = CAST(u.parent AS NVARCHAR(36))
      ${whereSql}
      ORDER BY it.created_at DESC
      OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;

    const countQuery = `
      SELECT COUNT(1) as cnt 
      FROM InventoryTransaction it
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON CAST(u.id AS NVARCHAR(36)) = CAST(gi.receiver_id AS NVARCHAR(36))
      LEFT JOIN organization_units ou ON CAST(ou.id AS NVARCHAR(36)) = CAST(u.parent AS NVARCHAR(36))
      ${whereSql}
    `;

    const summaryQuery = `
      SELECT 
        COUNT(1) as total,
        SUM(CASE WHEN UPPER(it.status) = 'DRAFT' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN UPPER(it.status) LIKE 'PENDING%' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN UPPER(it.status) = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN UPPER(it.status) = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN UPPER(it.status) = 'PARTIAL' OR (UPPER(it.status) IN ('FINISHED', 'COMPLETED') AND ISNULL(iti_sums.sum_act, 0) < ISNULL(iti_sums.sum_req, 0)) 
            THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN UPPER(it.status) IN ('FINISHED', 'COMPLETED') AND ISNULL(iti_sums.sum_act, 0) >= ISNULL(iti_sums.sum_req, 0) 
            THEN 1 ELSE 0 END) as finished
      FROM InventoryTransaction it
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN (
        SELECT transaction_id, SUM(requested_quantity) as sum_req, SUM(actual_quantity) as sum_act
        FROM InventoryTransaction_Item
        GROUP BY transaction_id
      ) iti_sums ON iti_sums.transaction_id = it.id
      LEFT JOIN users u ON CAST(u.id AS NVARCHAR(36)) = CAST(gi.receiver_id AS NVARCHAR(36))
      LEFT JOIN organization_units ou ON CAST(ou.id AS NVARCHAR(36)) = CAST(u.parent AS NVARCHAR(36))
      ${summaryWhereSql}
    `;

    const [items, countRes, summaryRes] = await Promise.all([
      this.dataSource.query(query, params),
      this.dataSource.query(countQuery, params),
      this.dataSource.query(summaryQuery, params),
    ]);

    const total = countRes[0]?.cnt || 0;
    const s = summaryRes[0] || {};

    return {
      success: true,
      data: {
        total: Number(total),
        page,
        limit,
        items,
        summary: {
          total: Number(s.total || 0),
          draft: Number(s.draft || 0),
          pending: Number(s.pending || 0),
          approved: Number(s.approved || 0),
          rejected: Number(s.rejected || 0),
          partial: Number(s.partial || 0),
          finished: Number(s.finished || 0)
        }
      }
    };
  }

  async getGoodsIssueDetail(transactionId: number) {
    const trans = await this.dataSource.query(`
      SELECT 
        it.id, it.transaction_code as request_number, it.status, it.transaction_type,
        it.created_at, gi.priority, gi.needed_date as need_date, gi.reason, ISNULL(gi.department, ou.name) as department_name, 
        gi.signature, 
        ISNULL(gi.requester_name, ISNULL(u.FullName, u.name)) as requester_name,
        ISNULL(gi.requester_username, u.username) as requester_username,
        gi.requester_id,
        gi.status as approval_status,
        gi.approver
      FROM InventoryTransaction it
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      LEFT JOIN users u ON CAST(u.id AS NVARCHAR(36)) = CAST(gi.receiver_id AS NVARCHAR(36))
      LEFT JOIN organization_units ou ON CAST(ou.id AS NVARCHAR(36)) = CAST(u.parent AS NVARCHAR(36))
      WHERE it.id = @0
    `, [transactionId]);

    if (!trans.length) throw new NotFoundException('Không tìm thấy phiếu');

    const items = await this.dataSource.query(`
      SELECT 
        iti.id as item_id,
        iti.product_id, 
        p.code as product_code, 
        p.name as product_name, 
        p.image_url as product_image,
        p.unit, 
        iti.requested_quantity, 
        CASE WHEN ISNULL(iti.actual_quantity, 0) > 0 THEN iti.actual_quantity ELSE iti.requested_quantity END as actual_quantity,
        iti.unit_price,
        ISNULL(NULLIF(iti.unit_price, 0), p.reference_price) as price,
        ISNULL(p.quotaValue, 0) as limit_quantity,
        0 as limit_used, 
        ISNULL(p.quotaValue, 0) as limit_remaining,
        ISNULL(inv.quantity, 0) as stock_quantity,
        CASE WHEN ISNULL(inv.quantity, 0) >= iti.requested_quantity THEN 'ok' ELSE 'warning' END as stock_status
      FROM InventoryTransaction_Item iti
      JOIN Product p ON p.id = iti.product_id
      LEFT JOIN Inventories inv ON inv.product_id = p.id
      WHERE iti.transaction_id = @0
    `, [transactionId]);

    const logs = await this.dataSource.query(`
      SELECT 
        l.action_type, l.status, l.note as comment, l.created_at, 
        ISNULL(NULLIF(u.FullName, ''), u.username) as actor_name, 
        NULLIF(u.role, 'everyone') as actor_role
      FROM InventoryTransaction_Log l
      LEFT JOIN users u ON CAST(u.id AS NVARCHAR(36)) = CAST(l.sender_id AS NVARCHAR(36))
      WHERE l.transaction_id = @0
      ORDER BY l.created_at ASC
    `, [transactionId]);

    // Tính tổng theo actual_quantity (SL duyệt thực tế) nếu có, fallback về requested_quantity
    const estimated_value = items.reduce((acc, item) => {
      const qty = Number(item.actual_quantity || 0) > 0 ? Number(item.actual_quantity) : Number(item.requested_quantity || 0);
      return acc + (Number(item.price || 0) * qty);
    }, 0);

    return {
      success: true,
      data: {
        ...trans[0],
        items,
        logs,
        estimated_value
      }
    };
  }

  async approveRequest(id: number, dto: any, userId: string, role: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const trans = await queryRunner.manager.findOne(InventoryTransactionEntity, { where: { id } });
      if (!trans) throw new NotFoundException('Không tìm thấy phiếu');

      // 1. Kiểm tra thẩm quyền của người duyệt hiện tại
      const currentGI = await queryRunner.manager.query(
        `SELECT approver, status FROM GoodsIssue WHERE transaction_id = @0`, [id]
      );
      // Fetch actual user info to handle both ID and Username matches
      const userDetail = await this.dataSource.query(
        `SELECT id, username FROM users WHERE username = @0 OR id = TRY_CAST(@0 AS UNIQUEIDENTIFIER)`,
        [userId]
      ).catch(() => []);
      const trueUserId = userDetail[0]?.id || userId;

      const roleInfo = await this.usersService.findProcessRoleInfoById(trueUserId);
      const staticPermissions = roleInfo?.staticPermissions || [];
      const currentApprover = currentGI[0]?.approver;
      const isAdmin = staticPermissions.some(p => p.code === 'admin_vpp');

      if (!isAdmin && String(currentApprover) !== String(trueUserId)) {
        throw new ForbiddenException('Bạn không phải là người có thẩm quyền phê duyệt phiếu này ở bước hiện tại.');
      }

      // Người tạo phiếu không có quyền duyệt (Kể cả admin nếu là người tạo cũng không nên tự duyệt)
      if (trans.createdById && String(trans.createdById) === String(userId)) {
        throw new BadRequestException('Người tạo phiếu không có quyền duyệt phiếu');
      }

      const nextApprover = (dto?.approver || '').toString().trim();
      const isStepApproval = Boolean(nextApprover);

      // 2. Nếu có người duyệt tiếp theo, kiểm tra xem họ có trong luồng duyệt VPP không
      if (isStepApproval) {
        const validWorkflow = await queryRunner.manager.query(
          `SELECT 1 FROM common_workflows WHERE approver_id = @0 AND module_type = 'VPP'`,
          [nextApprover]
        );
        if (validWorkflow.length === 0) {
          throw new BadRequestException('Người duyệt tiếp theo không nằm trong luồng phê duyệt VPP hợp lệ.');
        }
      }

      const reviewerId = dto.reviewer || userId;

      // Update item actual_quantity
      if (dto.items && Array.isArray(dto.items)) {
        for (const it of dto.items) {
          await queryRunner.manager.update(InventoryTransactionItemEntity,
            { transactionId: id, productId: it.product_id || it.productId },
            { actual_quantity: it.actual_quantity }
          );
        }
      }

      if (isStepApproval) {
        // Duyệt bước hiện tại và chuyển sang approver kế tiếp
        trans.status = 'PENDING_APPROVAL';
        await queryRunner.manager.save(trans);

        const currentGI = await queryRunner.manager.query(`SELECT status FROM GoodsIssue WHERE transaction_id = @0`, [id]);
        const currentStatus = Number(currentGI[0]?.status || 2);
        const nextStatus = currentStatus + 1;

        await queryRunner.manager.query(`
          UPDATE GoodsIssue 
          SET status = @1, approver = @2
          WHERE transaction_id = @0
        `, [id, nextStatus, nextApprover]);

        const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
          transactionId: id,
          action_type: 'APPROVED_STEP',
          status: 'PENDING_APPROVAL',
          senderId: userId,
          note: dto.note || 'Duyệt bước và chuyển tiếp',
          ip: ip || 'unknown',
          resource: resource || 'approveRequest'
        });
        await queryRunner.manager.save(log);
      } else {
        // Duyệt hoàn tất -> Chờ cấp phát
        const newStatus = 'APPROVED';
        trans.status = newStatus;
        await queryRunner.manager.save(trans);

        // Đồng bộ sang bảng GoodsIssue, gán id reviewer vào trường reviewer_id
        await queryRunner.manager.query(`
          UPDATE GoodsIssue 
          SET status = @1, 
              reviewer_id = @2,
              approver = @2
          WHERE transaction_id = @0
        `, [id, 4, reviewerId]);

        // NOTE: Không trừ tồn kho ở bước duyệt (APPROVED = Chờ cấp phát).
        // Tồn kho sẽ được trừ khi xác nhận cấp phát/hoàn thành (confirmIssue).

        const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
          transactionId: id,
          action_type: 'APPROVED',
          status: newStatus,
          senderId: userId,
          note: dto.note || `Phê duyệt phiếu: ${newStatus}`,
          ip: ip || 'unknown',
          resource: resource || 'approveRequest'
        });
        await queryRunner.manager.save(log);
      }

      await queryRunner.commitTransaction();
      return {
        success: true,
        message: isStepApproval ? 'Đã duyệt bước và chuyển tiếp' : 'Phê duyệt thành công',
        data: { new_status: isStepApproval ? 'PENDING_APPROVAL' : 'APPROVED' }
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectRequest(id: number, dto: { note: string }, userId: string, role: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Kiểm tra thẩm quyền từ chối
      const currentGI = await queryRunner.manager.query(
        `SELECT approver FROM GoodsIssue WHERE transaction_id = @0`, [id]
      );
      const currentApprover = currentGI[0]?.approver;

      // Fetch actual user info to handle both ID and Username matches
      const userDetail = await this.dataSource.query(
        `SELECT id, username FROM users WHERE username = @0 OR id = TRY_CAST(@0 AS UNIQUEIDENTIFIER)`,
        [userId]
      ).catch(() => []);
      const trueUserId = userDetail[0]?.id || userId;

      const roleInfo = await this.usersService.findProcessRoleInfoById(trueUserId);
      const staticPermissions = roleInfo?.staticPermissions || [];
      const isAdmin = staticPermissions.some(p => p.code === 'admin_vpp');

      if (!isAdmin && String(currentApprover) !== String(trueUserId)) {
        throw new ForbiddenException('Bạn không phải là người có thẩm quyền từ chối phiếu này.');
      }

      const trans = await queryRunner.manager.findOne(InventoryTransactionEntity, { where: { id } });
      if (!trans) throw new NotFoundException('Không tìm thấy phiếu');

      if (trans.status !== 'pending_dept_approval' && trans.status !== 'pending_hc_approval' && trans.status !== 'PENDING_APPROVAL') {
        throw new BadRequestException('Trạng thái phiếu hiện tại không thể từ chối');
      }

      trans.status = 'REJECTED'; // Từ chối
      await queryRunner.manager.save(trans);

      const rejectId = (dto as any).reject_id || userId;

      // Đồng bộ sang bảng GoodsIssue, lưu reject_id
      await queryRunner.manager.query(`
        UPDATE GoodsIssue SET status = 5, reject_id = @1 WHERE transaction_id = @0
      `, [id, rejectId]);

      const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
        transactionId: id,
        action_type: 'REJECTED',
        status: 'REJECTED',
        senderId: rejectId,
        note: dto.note || 'Từ chối phiếu đề nghị',
        ip: ip || 'unknown',
        resource: resource || 'rejectRequest'
      });
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Đã từ chối phiếu' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteIssueRequest(id: number, userId: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const trans = await queryRunner.manager.findOne(InventoryTransactionEntity, { where: { id } });
      if (!trans) throw new NotFoundException('Không tìm thấy phiếu');

      // Chỉ cho phép xóa phiếu ở trạng thái DRAFT
      if (trans.status?.toUpperCase() !== 'DRAFT') {
        throw new BadRequestException('Chỉ có thể xóa phiếu ở trạng thái Nháp (DRAFT)');
      }

      // Fetch actual user info to handle both ID and Username matches
      const userDetail = await this.dataSource.query(
        `SELECT id, username FROM users WHERE id = @0 OR username = @0`,
        [userId]
      );
      const trueUserId = userDetail[0]?.id || userId;

      // Kiểm tra quyền (chủ sở hữu phiếu)
      // Kiểm tra cả createdById và requester_id trong GoodsIssue
      const giOwnerCheck = await queryRunner.manager.query(
        `SELECT requester_id FROM GoodsIssue WHERE transaction_id = @0`, [id]
      );
      const requesterId = giOwnerCheck[0]?.requester_id;

      if (String(trans.createdById) !== String(trueUserId) && String(requesterId) !== String(trueUserId)) {
        throw new ForbiddenException('Bạn không có quyền xóa phiếu này');
      }

      // 1. Xóa items
      await queryRunner.manager.delete(InventoryTransactionItemEntity, { transactionId: id });

      // 2. Xóa GoodsIssue
      await queryRunner.manager.query(`DELETE FROM GoodsIssue WHERE transaction_id = @0`, [id]);

      // 3. Xóa Logs
      await queryRunner.manager.delete(InventoryTransactionLogEntity, { transactionId: id });

      // 4. Xóa Transaction chính
      await queryRunner.manager.remove(trans);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Đã xóa phiếu thành công' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async escalateRequest(id: number, dto: { note?: string; approver?: string }, userId: string, role: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Kiểm tra thẩm quyền chuyển cấp trên
      const currentGI_Auth = await queryRunner.manager.query(
        `SELECT approver FROM GoodsIssue WHERE transaction_id = @0`, [id]
      );
      // Fetch actual user info to handle both ID and Username matches
      const userDetail = await this.dataSource.query(
        `SELECT id, username FROM users WHERE username = @0 OR id = TRY_CAST(@0 AS UNIQUEIDENTIFIER)`,
        [userId]
      ).catch(() => []);
      const trueUserId = userDetail[0]?.id || userId;

      const roleInfo = await this.usersService.findProcessRoleInfoById(trueUserId);
      const staticPermissions = roleInfo?.staticPermissions || [];
      const currentApprover = currentGI_Auth[0]?.approver;
      const isAdmin = staticPermissions.some(p => p.code === 'admin_vpp');

      if (!isAdmin && String(currentApprover) !== String(trueUserId)) {
        throw new ForbiddenException('Bạn không phải là người có thẩm quyền xử lý phiếu này.');
      }

      const trans = await queryRunner.manager.findOne(InventoryTransactionEntity, { where: { id } });
      if (!trans) throw new NotFoundException('Không tìm thấy phiếu');

      // if (trans.status !== 'pending_dept_approval') {
      //   return { success: false, message: 'Chỉ có thể chuyển cấp trên khi phiếu đang chờ Trưởng phòng duyệt' };
      // }

      trans.status = 'PENDING_APPROVAL'; // Luôn là Chờ duyệt tại các bước CB, VT, PTP
      await queryRunner.manager.save(trans);

      const nextApprover = (dto.approver || '').toString().trim();

      // Kiểm tra người nhận cấp trên có hợp lệ không
      if (nextApprover) {
        const validWorkflow = await queryRunner.manager.query(
          `SELECT 1 FROM common_workflows WHERE approver_id = @0 AND module_type = 'VPP'`,
          [nextApprover]
        );
        if (validWorkflow.length === 0) {
          throw new BadRequestException('Người xử lý tiếp theo không nằm trong luồng phê duyệt VPP hợp lệ.');
        }
      }

      // Mặc định tăng status lên 1 để chuyển sang bước tiếp theo trong luồng
      const currentGI = await queryRunner.manager.query(`SELECT status FROM GoodsIssue WHERE transaction_id = @0`, [id]);
      const currentStatus = Number(currentGI[0]?.status || 2);
      const nextStatus = currentStatus + 1;

      // Đồng bộ sang bảng GoodsIssue
      await queryRunner.manager.query(`
        UPDATE GoodsIssue SET status = @1, approver = @2 WHERE transaction_id = @0
      `, [id, nextStatus, nextApprover]);

      const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
        transactionId: id,
        action_type: 'ESCALATED',
        status: 'PENDING_APPROVAL',
        senderId: userId,
        note: dto.note || 'Chuyển cấp trên xử lý',
        ip: ip || 'unknown',
        resource: resource || 'escalateRequest'
      });
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Đã chuyển phiếu lên cấp trên' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resubmitRequest(id: number, dto: any, userId: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(`UPDATE InventoryTransaction SET status = 'PENDING_APPROVAL', updated_at = GETDATE() WHERE id = @0`, [id]);
      await queryRunner.manager.query(`UPDATE GoodsIssue SET status = 2, approver = @0, reason = @1, priority = @2, needed_date = @3 WHERE transaction_id = @4`, [dto.approver, dto.reason, dto.priority, dto.need_date, id]);
      await queryRunner.manager.query(`DELETE FROM InventoryTransaction_Item WHERE transaction_id = @0`, [id]);
      for (const reqItem of dto.items) {
        await queryRunner.manager.query(`INSERT INTO InventoryTransaction_Item (transaction_id, product_id, requested_quantity, actual_quantity, note, unit_price) VALUES (@0, @1, @2, @3, @4, @5)`, [id, reqItem.product_id, reqItem.requested_quantity, 0, reqItem.note || '', reqItem.price || 0]);
      }
      await queryRunner.manager.query(`INSERT INTO InventoryTransaction_Log (transaction_id, action_type, status, sender_id, approval_id, note, ip, resource, created_at) VALUES (@0, 'RESUBMIT', 'PENDING_APPROVAL', @1, @2, @3, @4, @5, GETDATE())`, [id, userId, dto.approver, 'Gửi lại phiếu sau khi hiệu chỉnh chi tiết', ip || 'unknown', resource || 'resubmitRequest']);
      await queryRunner.commitTransaction();
      return { success: true, message: 'Gửi lại phiếu thành công' };
    } catch (err) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmIssue(dto: any, userId: string, ip: string, resource: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { transaction_id, signature, items } = dto;
      const trans = await queryRunner.manager.findOne(InventoryTransactionEntity, { where: { id: transaction_id } });
      if (!trans) throw new NotFoundException('Không tìm thấy phiếu');

      // Fetch actual user info to handle both ID and Username matches
      const userDetail = await this.dataSource.query(
        `SELECT CAST(id AS NVARCHAR(36)) as id, username FROM users WHERE username = @0 OR CAST(id AS NVARCHAR(36)) = @0`,
        [userId]
      ).catch(() => []);
      const trueUserId = userDetail[0]?.id || userId;

      const roleInfo = await this.usersService.findProcessRoleInfoById(trueUserId);
      const isAdmin = roleInfo?.staticPermissions?.some(p => p.code === 'admin_vpp');
      const isUserVpp = roleInfo?.staticPermissions?.some(p => p.code === 'user_vpp');

      if (!isAdmin && !isUserVpp) {
        throw new ForbiddenException('Bạn không có quyền xác nhận cấp phát (Yêu cầu quyền admin_vpp hoặc user_vpp)');
      }

      // 1. Xử lý chữ ký
      let signatureUrl = signature;
      if (signature && signature.startsWith('data:image')) {
        signatureUrl = await this.processSignatureBase64(signature, queryRunner, userId);
      }

      // 2. Cập nhật GoodsIssue (chữ ký và status)
      const allFinished = items.every((i: any) => i.is_finished !== false); // Giả sử nếu không gửi is_finished thì coi như xong
      const status = allFinished ? 'FINISHED' : 'PARTIAL';

      await queryRunner.manager.query(`
        UPDATE GoodsIssue 
        SET signature = @0, status = @1 
        WHERE transaction_id = @2
      `, [signatureUrl, status === 'FINISHED' ? 1 : 2, transaction_id]);

      // 3. Cập nhật trạng thái InventoryTransaction
      trans.status = status;
      await queryRunner.manager.save(trans);

      // 4. Cập nhật số lượng thực cấp cho từng item
      for (const itemDto of items) {
        const item = await queryRunner.manager.findOne(InventoryTransactionItemEntity, {
          where: { transactionId: transaction_id, productId: itemDto.product_id }
        });
        if (item) {
          item.actual_quantity = Number(itemDto.actual_quantity || 0);
          await queryRunner.manager.save(item);
        }
      }

      // 4.5 Trừ tồn kho chỉ khi phiếu hoàn thành (FINISHED).
      // Tránh trừ ở trạng thái "Chờ cấp phát" (APPROVED) hoặc khi cấp phát dở dang (PARTIAL).
      if (status === 'FINISHED' && trans.transaction_type !== 'ISSUE') {
        for (const itemDto of items) {
          const qtyToDeduct = Number(itemDto.actual_quantity || 0);
          const productId = Number(itemDto.product_id);
          if (!productId || qtyToDeduct <= 0) continue;

          let inventory = await queryRunner.manager.findOne(InventoriesEntity, { where: { productId } });
          if (inventory) {
            inventory.quantity = Number(inventory.quantity) - qtyToDeduct;
            await queryRunner.manager.save(inventory);
          } else {
            inventory = queryRunner.manager.create(InventoriesEntity, {
              productId,
              quantity: -qtyToDeduct,
            });
            await queryRunner.manager.save(inventory);
          }
        }

        trans.transaction_type = 'ISSUE';
        await queryRunner.manager.save(trans);
      }

      // 5. Thêm log
      const log = queryRunner.manager.create(InventoryTransactionLogEntity, {
        transactionId: transaction_id,
        action_type: 'CONFIRM_ISSUE',
        status: status,
        senderId: userId,
        note: `Xác nhận cấp phát - ${status}`,
        ip: ip || 'unknown',
        resource: resource || 'confirmIssue'
      });
      await queryRunner.manager.save(log);

      await queryRunner.commitTransaction();
      return { success: true, message: 'Xác nhận cấp phát thành công' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async exportExcel(filter: InventoryFilterDto) {
    const { keyword, category, stockStatus } = filter;

    const query = this.productRepo.createQueryBuilder('p')
      .leftJoin(InventoriesEntity, 'i', 'i.product_id = p.id')
      .select([
        'p.code as product_code',
        'p.name as product_name',
        'p.category as category',
        'p.unit as unit',
        'i.quantity as quantity',
        'i.min_stock as min_stock',
        'i.max_stock as max_stock',
        'i.updated_at as updated_at'
      ])
      .where('p.status = :status', { status: 'active' });

    if (keyword) {
      query.andWhere('(p.name LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (category && category !== 'all') {
      query.andWhere('p.category = :category', { category });
    }

    if (stockStatus === 'OUT') {
      query.andWhere('(i.quantity IS NULL OR i.quantity <= 0)');
    } else if (stockStatus === 'LOW') {
      query.andWhere('i.quantity > 0 AND i.quantity < 30');
    } else if (stockStatus === 'ENOUGH') {
      query.andWhere('i.quantity >= 30');
    }
    // nếu 'all' thì không filter thêm tồn kho

    const items = await query.orderBy('p.id', 'DESC').getRawMany();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TonKhoVPP');

    worksheet.columns = [
      { header: 'Mã mặt hàng', key: 'product_code', width: 15 },
      { header: 'Tên mặt hàng', key: 'product_name', width: 30 },
      { header: 'Nhóm hàng', key: 'category', width: 20 },
      { header: 'Đơn vị tính', key: 'unit', width: 12 },
      { header: 'Số lượng tồn', key: 'quantity', width: 12 },
      { header: 'Tồn tối thiểu', key: 'min_stock', width: 12 },
      { header: 'Tồn tối đa', key: 'max_stock', width: 12 },
      { header: 'Cập nhật cuối', key: 'updated_at', width: 20 },
    ];

    items.forEach(item => {
      worksheet.addRow({
        ...item,
        quantity: Number(item.quantity || 0),
        min_stock: 30, // Theo yêu cầu hiển thị ngưỡng 30
        updated_at: item.updated_at ? item.updated_at.toLocaleString() : '---'
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportGoodsIssuesExcel(filter: GoodsIssueFilterDto, userId: string) {
    const pageBak = filter.page;
    const limitBak = filter.limit;
    filter.page = 1;
    filter.limit = 5000; // Get most records for export

    // Reuse existing logic to get data
    const { data } = await this.getGoodsIssues(filter, userId);

    // Restore filter
    filter.page = pageBak;
    filter.limit = limitBak;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DanhSachDeNghiVPP');

    worksheet.columns = [
      { header: 'Mã phiếu', key: 'request_number', width: 15 },
      { header: 'Ngày tạo', key: 'created_at', width: 18 },
      { header: 'Người đề nghị', key: 'requester_name', width: 25 },
      { header: 'Bộ phận', key: 'department_name', width: 25 },
      { header: 'Ngày cần', key: 'need_date', width: 15 },
      { header: 'Trạng thái', key: 'status_text', width: 15 },
      { header: 'Số lượng hàng', key: 'total_items', width: 15 },
      { header: 'Giá trị (VNĐ)', key: 'estimated_value', width: 20 },
      { header: 'Lý do', key: 'reason', width: 40 },
    ];

    const statusMap = {
      'DRAFT': 'Nháp',
      'PENDING_APPROVAL': 'Chờ duyệt',
      'APPROVED': 'Chờ cấp phát',
      'REJECTED': 'Từ chối',
      'FINISHED': 'Hoàn thành',
      'COMPLETED': 'Hoàn thành'
    };

    data.items.forEach(item => {
      worksheet.addRow({
        ...item,
        created_at: item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '',
        need_date: item.need_date ? new Date(item.need_date).toLocaleDateString('vi-VN') : '',
        status_text: statusMap[item.status.toUpperCase()] || item.status,
        estimated_value: Number(item.estimated_value || 0).toLocaleString('vi-VN')
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    return await workbook.xlsx.writeBuffer();
  }

  async exportDistributionExcel(filter: GoodsIssueFilterDto, userId: string) {
    // Luôn lấy trạng thái chờ cấp phát nếu không chỉ định
    if (!filter.status || filter.status === 'all') {
      filter.status = 'APPROVED';
    }

    // Lấy dữ liệu các phiếu
    const { data: requestData } = await this.getGoodsIssues({ ...filter, page: 1, limit: 1000 }, userId);
    const requestIds = requestData.items.map(it => it.id);

    if (requestIds.length === 0) {
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('BaoCaoCapPhat');
      return await workbook.xlsx.writeBuffer();
    }

    // Lấy chi tiết từng mặt hàng của các phiếu này
    const items = await this.dataSource.query(`
      SELECT 
        it.transaction_code as request_number,
        gi.requester_name,
        gi.department as department_name,
        p.code as product_code,
        p.name as product_name,
        ti.requested_quantity,
        ti.actual_quantity,
        p.unit,
        p.category as category_name
      FROM InventoryTransaction_Item ti
      JOIN InventoryTransaction it ON it.id = ti.transaction_id
      JOIN GoodsIssue gi ON gi.transaction_id = it.id
      JOIN Product p ON p.id = ti.product_id
      WHERE ti.transaction_id IN (${requestIds.join(',')})
      ORDER BY it.transaction_code ASC, p.name ASC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BaoCaoCapPhatVPP');

    worksheet.columns = [
      { header: 'Mã phiếu', key: 'request_number', width: 15 },
      { header: 'Người đề nghị', key: 'requester_name', width: 25 },
      { header: 'Bộ phận', key: 'department_name', width: 25 },
      { header: 'Mã hàng', key: 'product_code', width: 15 },
      { header: 'Tên mặt hàng', key: 'product_name', width: 30 },
      { header: 'Loại hàng', key: 'category_name', width: 20 },
      { header: 'Đơn vị', key: 'unit', width: 10 },
      { header: 'SL Yêu cầu', key: 'requested_quantity', width: 12 },
      { header: 'SL Thực cấp', key: 'actual_quantity', width: 12 },
    ];

    items.forEach(item => {
      worksheet.addRow({
        ...item,
        requested_quantity: Number(item.requested_quantity || 0),
        actual_quantity: Number(item.actual_quantity || 0)
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    return await workbook.xlsx.writeBuffer();
  }

  async getGoodsIssueDepartments(userId: string) {
    // Lấy danh sách phòng ban duy nhất từ bảng GoodsIssue. 
    // Logic: Nếu gi.department có giá trị thì lấy, nếu không thì lấy tên từ organization_units dựa trên receiver_id.
    const query = `
      SELECT DISTINCT 
        ISNULL(NULLIF(gi.department, ''), ou.name) as name
      FROM GoodsIssue gi
      LEFT JOIN users u ON u.id = gi.receiver_id
      LEFT JOIN organization_units ou ON ou.id = u.parent
      WHERE (gi.department IS NOT NULL AND gi.department != '') OR ou.name IS NOT NULL
      ORDER BY name ASC
    `;
    const result = await this.dataSource.query(query);
    return { success: true, data: result };
  }
}
