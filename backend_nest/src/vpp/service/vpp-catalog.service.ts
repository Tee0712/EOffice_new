import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like, Raw } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoriesEntity } from '../entities/inventories.entity';
import { ProductLimitEntity } from '../entities/product-limit.entity';
import { CatalogFilterDto, CreateProductDto, UpdateProductDto } from '../dto/catalog.dto';
import { AuditService } from './audit.service';
import { FileEntity } from 'src/files-managerment/file.entity';
import { FileRelationEntity } from 'src/files-managerment/file-relation.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

@Injectable()
export class VppCatalogService {
  constructor(
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
    @InjectRepository(ProductEntity, 'mssqlConnection')
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(InventoriesEntity, 'mssqlConnection')
    private readonly inventoryRepo: Repository<InventoriesEntity>,
    @InjectRepository(ProductLimitEntity, 'mssqlConnection')
    private readonly limitRepo: Repository<ProductLimitEntity>,
    @InjectRepository(FileEntity, 'mssqlConnection')
    private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(FileRelationEntity, 'mssqlConnection')
    private readonly fileRelationRepo: Repository<FileRelationEntity>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(filter: CatalogFilterDto, userId: string) {
    const { keyword, category, status } = filter;
    const page = filter.page ? Number(filter.page) : 1;
    const limit = filter.limit ? Number(filter.limit) : 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const query = this.productRepo.createQueryBuilder('p')
      .leftJoinAndMapOne('p.inventory', InventoriesEntity, 'i', 'i.product_id = p.id')
      .leftJoinAndMapOne('p.limit', ProductLimitEntity, 'pl',
        `pl.product_id = p.id AND pl.user_id = :userId AND pl.limit_month = :month AND pl.limit_year = :year`,
        {
          userId,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      );

    if (keyword) {
      // Sử dụng COLLATE Latin1_General_CI_AI để tìm kiếm không dấu (VD: "but" tìm thấy "bút")
      query.andWhere('(p.name COLLATE Latin1_General_CI_AI LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (category) {
      query.andWhere('p.category = :category', { category });
    }
    if (status && status !== 'all') {
      query.andWhere('p.status = :status', { status });
    }

    const [items, total] = await query
      .skip(skip)
      .take(take)
      .orderBy('p.id', 'DESC')
      .getManyAndCount();

    // Global stats for frontend dashboard cards
    const activeCount = await this.productRepo.count({ where: { status: 'active' } });
    const hiddenCount = await this.productRepo.count({ where: { status: 'hidden' } });

    return {
      success: true,
      data: {
        items: items.map(item => ({
          ...item,
          imageurl: item.image_url,
          imageUrl: item.image_url,
          image: item.image_url,
        })),
        total,
        page,
        limit,
        stats: {
          total: activeCount + hiddenCount,
          active: activeCount,
          hidden: hiddenCount
        }
      }
    };
  }

  async search(keyword: string) {
    const items = await this.productRepo.createQueryBuilder('p')
      .where('(p.name COLLATE Latin1_General_CI_AI LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` })
      .andWhere('p.status = :status', { status: 'active' })
      .take(15)
      .getMany();

    return {
      success: true,
      items: items.map(item => ({
        ...item,
        imageurl: item.image_url,
        imageUrl: item.image_url,
        image: item.image_url,
      })),
    };
  }

  async getCategories() {
    const categories = await this.productRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'value')
      .where('p.status = :status', { status: 'active' })
      .getRawMany();

    return {
      success: true,
      data: {
        total: categories.length,
        items: categories.map(c => ({ value: c.value, label: c.value })),
      }
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Không tìm thấy mặt hàng');
    }
    return {
      ...product,
      imageurl: product.image_url,
      imageUrl: product.image_url,
      image: product.image_url,
    };
  }

  async create(dto: CreateProductDto, userId: string) {
    const base64Input = dto.image_url || dto.imageurl || dto.imageUrl || (typeof dto.image === 'string' ? dto.image : undefined);

    const nextId = await this.getNextProductId();

    const productData: Partial<ProductEntity> = {
      id: nextId,
      code: dto.sku || 'VPP-TEMP', // Placeholder
      name: dto.name,
      category: dto.categoryId,
      unit: dto.unit,
      reference_price: dto.reference_price,
      note: dto.notes,
      image_url: (!base64Input || base64Input.startsWith('data:image')) ? undefined : base64Input,
      quotaValue: dto.quotaValue !== undefined && dto.quotaValue !== null ? String(dto.quotaValue) : undefined,
      quotaUnit: dto.quotaUnit !== undefined && dto.quotaUnit !== null ? String(dto.quotaUnit) : undefined,
    };

    let saved = await this.productRepo.save(this.productRepo.create(productData));

    // Update code: VPP-001
    const code = `VPP-${saved.id.toString().padStart(3, '0')}`;
    let finalImageUrl = saved.image_url;
    if (base64Input && base64Input.startsWith('data:image')) {
      finalImageUrl = await this.processBase64Image(base64Input, userId, saved.id);
    }

    await this.productRepo.update(saved.id, { code, image_url: finalImageUrl });
    saved.code = code;
    saved.image_url = finalImageUrl;

    await this.auditService.log(userId, 'CREATE', `Tạo mặt hàng VPP: ${saved.name} (${code})`, 'POST');
    return {
      ...saved,
      imageurl: saved.image_url,
      imageUrl: saved.image_url,
      image: saved.image_url,
    };
  }

  async update(id: number, dto: UpdateProductDto, userId: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy mặt hàng');

    const base64Input = dto.image_url || dto.imageurl || dto.imageUrl || (typeof dto.image === 'string' ? dto.image : undefined);
    let finalImageUrl: string | null = product.image_url;
    if (base64Input && base64Input.startsWith('data:image')) {
      finalImageUrl = await this.processBase64Image(base64Input, userId, id);
      console.log(finalImageUrl, 'finalImageUrlfinalImageUrl')
    } else if (base64Input) {
      finalImageUrl = base64Input;
    }
    console.log(finalImageUrl, 'finalImageUrl')
    const updateData: Partial<ProductEntity> = {
      name: dto.name,
      category: dto.categoryId,
      unit: dto.unit,
      reference_price: dto.reference_price,
      note: dto.notes,
      image_url: finalImageUrl,
      quotaValue: dto.quotaValue !== undefined && dto.quotaValue !== null ? String(dto.quotaValue) : undefined,
      quotaUnit: dto.quotaUnit !== undefined && dto.quotaUnit !== null ? String(dto.quotaUnit) : undefined,
    };
    if (dto.sku) {
      updateData.code = dto.sku;
    }

    await this.productRepo.update(id, updateData);
    const updated = await this.productRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Không tìm thấy mặt hàng');

    await this.auditService.log(userId, 'UPDATE', `Cập nhật thông tin mặt hàng VPP: ${product.code}`, 'PATCH');
    return {
      ...updated,
      imageurl: updated.image_url,
      imageUrl: updated.image_url,
      image: updated.image_url,
    };
  }

  async setStatus(id: number, status: string, userId: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy mặt hàng');

    await this.productRepo.update(id, { status });
    await this.auditService.log(userId, 'STATUS_CHANGE', `Thay đổi trạng thái mặt hàng ${product.code} sang ${status}`, 'PUT');

    return { id, status, updatedAt: new Date() };
  }

  async remove(id: number, userId: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy mặt hàng');

    const inventory = await this.inventoryRepo.findOne({ where: { productId: id } });
    if (inventory && inventory.quantity > 0) {
      throw new ConflictException(`Mặt hàng còn tồn kho (${inventory.quantity} đơn vị), không được phép xóa.`);
    }

    // Xóa các bảng liên quan để tránh FK error
    await this.limitRepo.delete({ productId: id });
    if (inventory) await this.inventoryRepo.delete({ productId: id });
    await this.productRepo.delete(id);

    await this.auditService.log(userId, 'DELETE', `Xóa vật lý mặt hàng VPP: ${product.name} (${product.code})`, 'DELETE');
    return { id, code: product.code, name: product.name, deletedAt: new Date() };
  }

  async uploadBase64(base64String: string, userId: string): Promise<string | null> {
    return await this.processBase64Image(base64String, userId);
  }

  public async processBase64Image(base64String: string, userId: string, objectId?: number): Promise<string | null> {
    console.log(base64String, 'base64String')
    if (!base64String || !base64String.startsWith('data:image')) {
      return base64String;
    }

    try {
      // Dùng regex linh hoạt hơn để khớp chuỗi base64 (bao gồm cả xuống dòng nếu có)
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,([\s\S]+)$/);
      if (!matches || matches.length !== 3) {
        return base64String;
      }
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = mimeType.split('/')[1] || 'png';
      const fileName = `vpp_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'upload', 'TCSG', 'VPP');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const storagePath = path.posix.join('TCSG', 'VPP', fileName);

      const newFile = this.fileRepo.create({
        file_name: fileName,
        storage_type: 'filesystem',
        storage_path: storagePath,
        file_path: storagePath,
        mime_type: mimeType,
        file_size: buffer.length,
        is_directory: false,
        created_by: userId,
        version: '1.0',
        status: 1
      });
      const savedFile = await this.fileRepo.save(newFile);

      if (objectId) {
        const newRelation = this.fileRelationRepo.create({
          object_type: 'vpp_catalog',
          object_id: String(objectId),
          file_id: savedFile.id,
        });
        await this.fileRelationRepo.save(newRelation);
      }

      return `${process.env.URL_NESTJS || 'http://localhost:3156'}/api/files/raw/${savedFile.id}`;
    } catch (err) {
      console.error('Error processing base64 vpp image:', err);
      // Nếu lỗi xử lý ảnh, trả về null để tránh việc lưu chuỗi base64 cực dài vào DB gây lỗi Truncated
      return base64String.startsWith('data:image') ? null : base64String;
    }
  }

  private isNullIdInsertError(error: unknown): boolean {
    const message = (error as any)?.message || '';
    return (
      typeof message === 'string'
      && message.includes("Cannot insert the value NULL into column 'id'")
      && message.includes('Product')
    );
  }

  private async getNextProductId(): Promise<number> {
    const tableName = this.getQualifiedProductTableName();
    const nextRows = await this.dataSource.query(
      `SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM ${tableName} WITH (UPDLOCK, HOLDLOCK)`,
    );
    const nextId = Number(nextRows?.[0]?.nextId);
    if (!Number.isFinite(nextId) || nextId <= 0) {
      throw new Error('Cannot resolve next Product.id');
    }
    return nextId;
  }

  private getQualifiedProductTableName(): string {
    const table = this.productRepo.metadata.tableName;
    const schema = this.productRepo.metadata.schema;
    return schema ? `${schema}.${table}` : table;
  }

  async importExcel(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new Error('Không tìm thấy file để import');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Không tìm thấy worksheet trong file Excel');
    }

    const results: {
      successCount: number;
      failCount: number;
      errors: any[];
      items: any[];
    } = {
      successCount: 0,
      failCount: 0,
      errors: [],
      items: [],
    };

    const rows: { row: ExcelJS.Row; rowNumber: number }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        rows.push({ row, rowNumber });
      }
    });

    for (const { row, rowNumber } of rows) {
      try {
        const name = row.getCell(1).value?.toString().trim();
        const categoryId = row.getCell(2).value?.toString().trim();
        const unit = row.getCell(3).value?.toString().trim();
        const referencePriceStr = row.getCell(4).value?.toString().trim();
        const quotaValue = row.getCell(5).value?.toString().trim();
        const quotaUnit = row.getCell(6).value?.toString().trim();
        const notes = row.getCell(7).value?.toString().trim();
        const sku = row.getCell(8).value?.toString().trim();

        // Validate required fields
        const rowErrors: string[] = [];
        if (!name) rowErrors.push('Tên mặt hàng không được trống');
        if (!categoryId) rowErrors.push('Nhóm hàng không được trống');
        if (!unit) rowErrors.push('Đơn vị tính không được trống');

        let reference_price: number | undefined = undefined;
        if (referencePriceStr) {
          reference_price = parseFloat(referencePriceStr);
          if (isNaN(reference_price)) {
            rowErrors.push('Giá tham khảo phải là số');
          }
        }

        if (rowErrors.length > 0) {
          results.failCount++;
          results.errors.push({
            row: rowNumber,
            errors: rowErrors,
          });
          continue;
        }

        const dto: CreateProductDto = {
          name: name as string,
          categoryId: categoryId as string,
          unit: unit as string,
          reference_price,
          quotaValue,
          quotaUnit,
          notes,
          sku,
        };

        const createdItem = await this.create(dto, userId);
        results.successCount++;
        results.items.push(createdItem);
      } catch (error) {
        results.failCount++;
        results.errors.push({
          row: rowNumber,
          errors: [error.message || 'Lỗi không xác định'],
        });
      }
    }

    await this.auditService.log(userId, 'IMPORT', `Import Excel danh mục VPP: thành công ${results.successCount}, thất bại ${results.failCount}`, 'POST');

    return results;
  }
  // async search(keyword: string) {
  //   const query = this.productRepo.createQueryBuilder('p')
  //     .select(['p.id', 'p.code', 'p.name', 'p.unit', 'p.category'])
  //     .where('p.status = :status', { status: 'active' });

  //   if (keyword) {
  //     query.andWhere('(p.name LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
  //   }

  //   const items = await query
  //     .orderBy('p.name', 'ASC')
  //     .limit(50)
  //     .getMany();

  //   return {
  //     success: true,
  //     data: items
  //   };
  // }
}
