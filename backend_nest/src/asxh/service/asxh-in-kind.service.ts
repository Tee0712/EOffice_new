import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull, Like } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { AssetEntity } from '../entities/asset.entity';
import { AssetSpecificationEntity } from '../entities/asset-specification.entity';
import { AssetAttachmentEntity } from '../entities/asset-attachment.entity';
import { HandoverAssetEntity } from '../entities/handover-asset.entity';
import { HandoverAttendeeEntity } from '../entities/handover-attendee.entity';
import { HandoverChecklistEntity } from '../entities/handover-checklist.entity';
import { HandoverLogEntity } from '../entities/handover-log.entity';
import { ProgramEntity } from '../entities/program.entity';
import { ProgramItemEntity } from '../entities/program-item.entity';
import { ProgramAssetSequenceEntity } from '../entities/program-asset-sequence.entity';
import { AsxhSupplierEntity } from '../entities/asxh-supplier.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import {
  CreateAssetDto,
  AssetListingQueryDto,
  UpdateAssetDto,
  CreateAssetSpecDto,
  HandoverContextQueryDto,
  HandoverListingQueryDto,
  CreateHandoverDto,
  UpdateHandoverDto,
  UserSearchQueryDto,
} from '../dto/asxh-in-kind';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierListingQueryDto,
} from '../dto/supplier.dto';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class AsxhInKindService {
  constructor(
    @InjectRepository(AssetEntity, 'mssqlConnection')
    private readonly assetRepo: Repository<AssetEntity>,
    @InjectRepository(AssetSpecificationEntity, 'mssqlConnection')
    private readonly specRepo: Repository<AssetSpecificationEntity>,
    @InjectRepository(AssetAttachmentEntity, 'mssqlConnection')
    private readonly attachmentRepo: Repository<AssetAttachmentEntity>,
    @InjectRepository(HandoverAssetEntity, 'mssqlConnection')
    private readonly handoverRepo: Repository<HandoverAssetEntity>,
    @InjectRepository(ProgramEntity, 'mssqlConnection')
    private readonly programRepo: Repository<ProgramEntity>,
    @InjectRepository(ProgramItemEntity, 'mssqlConnection')
    private readonly programItemRepo: Repository<ProgramItemEntity>,
    @InjectRepository(ProgramAssetSequenceEntity, 'mssqlConnection')
    private readonly sequenceRepo: Repository<ProgramAssetSequenceEntity>,
    @InjectRepository(AsxhSupplierEntity, 'mssqlConnection')
    private readonly supplierRepo: Repository<AsxhSupplierEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
  ) { }

  async getStatuses() {
    return [
      { value: 'RECEIVED', label: 'Đã tiếp nhận' },
      { value: 'IN_PROCUREMENT', label: 'Đang mua sắm' },
      { value: 'PURCHASED', label: 'Đã mua' },
      { value: 'SHIPPING', label: 'Đang vận chuyển' },
      { value: 'DELIVERED', label: 'Đã bàn giao' },
    ];
  }

  async getOverview(programId: number) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException(`Program with ID ${programId} not found`);

    // Fetch KPIs and Steps in parallel
    const [budgetResult, assetValueResult, stepData] = await Promise.all([
      this.programItemRepo
        .createQueryBuilder('pi')
        .select('SUM(pi.unit_price * pi.quantity)', 'total')
        .where('pi.program_id = :programId', { programId })
        .getRawOne(),
      this.assetRepo
        .createQueryBuilder('a')
        .select('SUM(a.unit_price * a.quantity)', 'total')
        .where('a.program_id = :programId', { programId })
        .getRawOne(),
      this.calculateStepProgress(programId),
    ]);

    const totalBudget = parseFloat(budgetResult?.total || 0);
    const totalAssetValue = parseFloat(assetValueResult?.total || 0);

    return {
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        start_date: program.start_date,
        end_date: program.end_date,
        locality: program.locality,
      },
      kpi: {
        total_budget: totalBudget,
        total_asset_value: totalAssetValue,
        remaining_budget: totalBudget - totalAssetValue,
      },
      steps: stepData,
    };
  }

  private async calculateStepProgress(programId: number) {
    // 1. Get status counts for all assets in the program
    const statusCounts = await this.assetRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .where('a.program_id = :programId', { programId })
      .groupBy('a.status')
      .getRawMany();

    const counts = {
      RECEIVED: 0,
      IN_PROCUREMENT: 0,
      PURCHASED: 0,
      SHIPPING: 0,
      DELIVERED: 0,
    };

    let total = 0;
    statusCounts.forEach((row) => {
      const cnt = parseInt(row.count, 10);
      if (counts.hasOwnProperty(row.status)) {
        counts[row.status] = cnt;
      }
      total += cnt;
    });

    // Hierarchical Progress:
    // Step 1: All assets (RECEIVED, IN_PROCUREMENT, PURCHASED, SHIPPING, DELIVERED)
    const step1Done = total;
    
    // Step 2: Completed procurement (PURCHASED, SHIPPING, DELIVERED)
    const step2Done = counts.PURCHASED + counts.SHIPPING + counts.DELIVERED;
    
    // Step 3: Completed handover (DELIVERED)
    const step3Done = counts.DELIVERED;

    return [
      {
        step_key: 'request_received',
        title: 'Tiếp nhận yêu cầu',
        done_items: step1Done,
        total_items: total,
        progress_pct: total > 0 ? Math.round((step1Done / total) * 100) : 0,
        status_label: 'Đã tiếp nhận',
      },
      {
        step_key: 'procurement',
        title: 'Mua sắm tài sản',
        done_items: step2Done,
        total_items: total,
        progress_pct: total > 0 ? Math.round((step2Done / total) * 100) : 0,
        status_label: 'Đang triển khai',
      },
      {
        step_key: 'handover_local',
        title: 'Bàn giao địa phương',
        done_items: step3Done,
        total_items: total,
        progress_pct: total > 0 ? Math.round((step3Done / total) * 100) : 0,
        status_label: 'Chờ hoàn tất',
      },
    ];
  }

  async getAssets(programId: number, query: AssetListingQueryDto) {
    const { keyword, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const qb = this.assetRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.specifications', 's')
      .leftJoinAndSelect('a.attachments', 'at')
      .leftJoinAndSelect('a.supplierRelation', 'supplier')
      .where('a.program_id = :programId', { programId });

    if (keyword) {
      qb.andWhere('(a.name LIKE :keyword OR a.code LIKE :keyword OR a.category LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    if (status) {
      qb.andWhere('a.status = :status', { status });
    }

    qb.orderBy('a.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map(asset => ({
        ...asset,
        value_total: (asset.unitPrice || 0) * (asset.quantity || 0),
        supplier_name: asset.supplierRelation?.name || asset.supplier || '',
      })),
      total,
      page,
      limit,
    };
  }

  async createAsset(programId: number, dto: CreateAssetDto) {
    return await this.dataSource.transaction(async (manager) => {
      const program = await manager.findOne(ProgramEntity, { where: { id: programId } });
      if (!program) throw new NotFoundException('Program not found');

      // 1. Manage Sequence
      let sequence = await manager.findOne(ProgramAssetSequenceEntity, {
        where: { programId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sequence) {
        sequence = manager.create(ProgramAssetSequenceEntity, { programId, nextAssetNo: 1 });
      }

      const currentSeq = sequence.nextAssetNo;
      sequence.nextAssetNo += 1;
      await manager.save(sequence);

      // 2. Generate Code (HV-005/01)
      const programNo = program.code.split('/').pop() || '000';
      const code = `HV-${programNo}/${currentSeq.toString().padStart(2, '0')}`;

      // 3. Create Asset
      const asset = manager.create(AssetEntity);
      asset.programId = programId;
      asset.code = code;
      asset.name = dto.name;
      asset.category = dto.category;
      asset.unit = dto.unit;
      asset.description = dto.description;
      asset.unitPrice = dto.unit_price;
      asset.quantity = dto.quantity;
      asset.requiredReceiptDate = dto.required_receipt_date ? new Date(dto.required_receipt_date) : undefined;
      asset.specialRequirements = dto.special_requirements;
      asset.supplier = dto.supplier;
      asset.supplierId = dto.supplier_id;
      asset.hasOfficialQuote = dto.has_official_quote;
      asset.status = dto.status || 'RECEIVED';

      const savedAsset = await manager.save(asset);

      // 4. Save Specifications if provided
      if (dto.specifications && dto.specifications.length > 0) {
        const specs = dto.specifications.map((s) => {
          const spec = manager.create(AssetSpecificationEntity);
          spec.assetId = savedAsset.id;
          spec.parameterName = s.parameter_name;
          spec.value = s.value;
          return spec;
        });
        await manager.save(specs);
      }

      return {
        id: savedAsset.id,
        code: savedAsset.code,
        name: savedAsset.name,
        status: savedAsset.status,
        amount_total: (savedAsset.unitPrice || 0) * (savedAsset.quantity || 0),
      };
    });
  }

  async getAssetDetail(assetId: number) {
    const asset = await this.assetRepo.findOne({
      where: { id: assetId },
      relations: ['specifications', 'attachments', 'handoverEvent', 'supplierRelation'],
    });

    if (!asset) throw new NotFoundException(`Asset with ID ${assetId} not found`);

    return asset;
  }

  async updateAsset(assetId: number, dto: UpdateAssetDto) {
    return await this.dataSource.transaction(async (manager) => {
      const asset = await manager.findOne(AssetEntity, { where: { id: assetId } });
      if (!asset) throw new NotFoundException(`Asset not found`);

      // 1. Update Asset info
      if (dto.name !== undefined) asset.name = dto.name;
      if (dto.category !== undefined) asset.category = dto.category;
      if (dto.unit !== undefined) asset.unit = dto.unit;
      if (dto.description !== undefined) asset.description = dto.description;
      if (dto.unit_price !== undefined) asset.unitPrice = dto.unit_price;
      if (dto.quantity !== undefined) asset.quantity = dto.quantity;
      
      const receiptDate = dto.required_receipt_date || (dto as any).receive_date;
      if (receiptDate !== undefined) {
        asset.requiredReceiptDate = receiptDate ? new Date(receiptDate) : undefined;
      }
      
      if (dto.special_requirements !== undefined) asset.specialRequirements = dto.special_requirements;
      if (dto.supplier !== undefined) asset.supplier = dto.supplier;
      if (dto.supplier_id !== undefined) asset.supplierId = dto.supplier_id;
      
      const hasQuote = dto.has_official_quote !== undefined ? dto.has_official_quote : (dto as any).has_quotation;
      if (hasQuote !== undefined) asset.hasOfficialQuote = !!hasQuote;
      
      if (dto.status !== undefined) asset.status = dto.status;

      await manager.save(asset);

      // 2. Sync Specifications if provided
      if (dto.specifications) {
        // Delete all old specs
        await manager.delete(AssetSpecificationEntity, { assetId });
        
        // Add new specs
        if (dto.specifications.length > 0) {
          const specs = dto.specifications.map((s) =>
            manager.create(AssetSpecificationEntity, {
              assetId: assetId,
              parameterName: s.parameter_name,
              value: s.value,
            }),
          );
          await manager.save(specs);
        }
      }

      return { success: true };
    });
  }

  async deleteAsset(assetId: number) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException(`Asset not found`);

    // Business Constraints
    if (asset.status !== 'RECEIVED') {
      throw new BadRequestException('Chỉ có thể xóa hiện vật ở trạng thái Tiếp nhận');
    }
    if (asset.handoverAssetId) {
      throw new BadRequestException('Hiện vật đã được lên lịch bàn giao, không thể xóa');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Delete specifications
      await manager.delete(AssetSpecificationEntity, { assetId });
      
      // 2. File cleanup logic and delete attachments
      const attachments = await manager.find(AssetAttachmentEntity, { where: { assetId } });
      for (const attach of attachments) {
        const fullPath = path.join(process.cwd(), attach.path);
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
        }
      }
      await manager.delete(AssetAttachmentEntity, { assetId });

      // 3. Remove the asset
      await manager.remove(asset);
      return { success: true };
    });
  }

  async addSpecification(assetId: number, dto: CreateAssetSpecDto) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException(`Asset with ID ${assetId} not found`);

    const spec = this.specRepo.create({
      assetId,
      parameterName: dto.parameter_name,
      value: dto.value,
    });
    return await this.specRepo.save(spec);
  }

  async deleteSpecification(specId: number) {
    await this.specRepo.delete(specId);
    return { success: true };
  }

  async uploadAttachment(assetId: number, title: string, docType: string, file: Express.Multer.File) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException(`Asset not found`);

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh', 'assets');
    await fs.ensureDir(uploadDir);

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    const attachment = this.attachmentRepo.create({
      assetId,
      title,
      docType,
      path: `upload/asxh/assets/${fileName}`,
    });

    return await this.attachmentRepo.save(attachment);
  }

  async deleteAttachment(attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException(`Attachment not found`);

    const fullPath = path.join(process.cwd(), attachment.path);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
    }

    await this.attachmentRepo.remove(attachment);
    return { success: true };
  }

  async findAttachmentById(attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    return attachment;
  }

  async getHandoverEvents(programId: number) {
    return await this.handoverRepo.find({
      where: { programId },
      order: { handoverDate: 'DESC' },
    });
  }

  async linkHandover(assetId: number, handoverAssetId: number) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    asset.handoverAssetId = handoverAssetId;
    await this.assetRepo.save(asset);
    return { success: true };
  }

  async getHandoverStatuses() {
    return [
      { id: 'DRAFT', name: 'Nháp' },
      { id: 'SCHEDULED', name: 'Đã lên lịch' },
      { id: 'WAITING_PURCHASE', name: 'Chờ mua xong' },
      { id: 'WAITING_HANDOVER', name: 'Chờ bàn giao' },
    ];
  }

  async getHandoverList(programId: number, query: HandoverListingQueryDto) {
    const { keyword, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.handoverRepo.createQueryBuilder('h')
      .where('h.programId = :programId', { programId });

    if (keyword) {
      qb.andWhere('h.eventName LIKE :keyword', { keyword: `%${keyword}%` });
    }

    qb.orderBy('h.handoverDate', 'DESC');

    const [handovers, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Fetch all assets linked to these handovers to get IDs
    const handoverIds = handovers.map((h) => h.id);
    const allAssets = handoverIds.length > 0
      ? await this.assetRepo.find({
          where: { handoverAssetId: In(handoverIds) },
          select: ['id', 'handoverAssetId'],
        })
      : [];

    // Group asset IDs by handoverAssetId
    const assetMap = new Map<number, number[]>();
    allAssets.forEach((a) => {
      if (a.handoverAssetId) {
        const ids = assetMap.get(a.handoverAssetId) || [];
        ids.push(a.id);
        assetMap.set(a.handoverAssetId, ids);
      }
    });

    const items = handovers.map((h) => {
      const assetIds = assetMap.get(h.id) || [];
      return {
        id: h.id,
        eventName: h.eventName,
        handoverDate: h.handoverDate,
        location: h.location,
        notes: h.notes,
        representativeName: h.representativeName,
        representativePhone: h.representativePhone,
        status: h.status,
        asset_count: assetIds.length,
        asset_ids: assetIds,
      };
    });

    return { items, total, page, limit };
  }

  async getHandoverContext(programId: number, query: HandoverContextQueryDto) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program not found');

    const statuses = query.selectable_statuses?.split(',') || ['PURCHASED'];

    // Fetch program asset summary (Total items and Total amount)
    const summary = await this.assetRepo
      .createQueryBuilder('a')
      .select('COUNT(a.id)', 'count')
      .addSelect('SUM(a.unit_price * a.quantity)', 'total')
      .where('a.program_id = :programId', { programId })
      .getRawOne();

    // Load selectable assets
    const assets = await this.assetRepo.find({
      where: {
        programId,
        status: In(statuses),
        handoverAssetId: IsNull(),
      },
    });

    const checklistTemplates = [
      { name: 'Kiểm tra tình trạng hiện vật trước khi vận chuyển', checklist_type: 'REQUIRED' },
      { name: 'Chuẩn bị biên bản bàn giao (theo mẫu)', checklist_type: 'REQUIRED' },
      { name: 'Xác nhận nhân sự tham gia bàn giao', checklist_type: 'REQUIRED' },
      { name: 'Chụp ảnh lưu niệm tại buổi lễ', checklist_type: 'OPTIONAL' },
    ];

    return {
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        locality: program.locality,
        total_items: parseInt(summary?.count || 0, 10),
        total_amount: parseFloat(summary?.total || 0),
      },
      assets: assets.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        quantity: a.quantity,
        unit_price: a.unitPrice,
        amount_total: (a.unitPrice || 0) * (a.quantity || 0),
        status: a.status,
        is_selectable: (a.status && statuses.includes(a.status)) && !a.handoverAssetId,
      })),
      checklist_templates: checklistTemplates,
    };
  }

  async createHandoverBatch(programId: number, dto: CreateHandoverDto, userId?: string) {
    return await this.dataSource.transaction(async (manager) => {
      const program = await manager.findOne(ProgramEntity, { where: { id: programId } });
      if (!program) throw new NotFoundException('Program not found');

      // 1. Create Handover Event
      const handover = manager.create(HandoverAssetEntity);
      handover.programId = programId;
      handover.eventName = dto.event_name;
      const formatTime = (t?: string) => {
        if (!t) return undefined;
        if (t.length === 5) return `${t}:00`;
        return t;
      };

      handover.handoverDate = dto.handover_date ? new Date(dto.handover_date) : (undefined as any);
      handover.startTime = formatTime(dto.start_time) as any;
      handover.endTime = formatTime(dto.end_time) as any;
      handover.location = dto.location as any;
      handover.eventType = dto.event_type;
      handover.format = dto.format;
      handover.notes = dto.notes as any;
      handover.representativeName = dto.representative_name as any;
      handover.representativeTitle = dto.representative_title as any;
      handover.representativePhone = dto.representative_phone as any;
      handover.representativeEmail = dto.representative_email as any;
      handover.status = dto.status || 'DRAFT';

      const savedHandover = await manager.save(handover);

      // 2. Link Assets
      if (dto.asset_ids && dto.asset_ids.length > 0) {
        await manager.update(AssetEntity, { id: In(dto.asset_ids) }, { handoverAssetId: savedHandover.id });
      }

      // 3. Create Attendees
      if (dto.attendees && dto.attendees.length > 0) {
        const attendees = dto.attendees.map((at) =>
          manager.create(HandoverAttendeeEntity, {
            handoverAssetId: savedHandover.id,
            userId: at.user_id,
            role: at.role,
          }),
        );
        await manager.save(attendees);
      }

      // 4. Create Checklist
      const incomingChecklist = dto.checklist || dto.checklists;
      if (incomingChecklist && incomingChecklist.length > 0) {
        const checklists = incomingChecklist.map((cl) => {
          let type = cl.checklist_type;
          if (type === 'MANDATORY' || type === 'Bắt buộc') type = 'REQUIRED';
          if (type === 'Mở rộng') type = 'OPTIONAL';

          return manager.create(HandoverChecklistEntity, {
            handoverAssetId: savedHandover.id,
            name: cl.name,
            checklistType: type,
            isDone: cl.is_done || false,
          });
        });
        await manager.save(checklists);
      }

      // 5. Create Log
      const log = manager.create(HandoverLogEntity);
      log.handoverAssetId = savedHandover.id;
      log.createdById = userId;
      log.action = 'CREATE_HANDOVER';
      await manager.save(log);

      return {
        id: savedHandover.id,
        event_name: savedHandover.eventName,
        asset_count: dto.asset_ids?.length || 0,
      };
    });
  }

  async getHandoverDetail(id: number) {
    const handover = await this.handoverRepo.findOne({ where: { id } });
    if (!handover) throw new NotFoundException('Handover event not found');

    const assets = await this.assetRepo.find({ where: { handoverAssetId: id } });
    const attendeesRaw = await this.dataSource.getRepository(HandoverAttendeeEntity).find({ where: { handoverAssetId: id } });
    
    // Enrich attendees with user names
    const userIds = attendeesRaw.map(a => a.userId).filter(id => !!id);
    const users = userIds.length > 0 ? await this.userRepo.find({
      where: { id: In(userIds) },
      select: ['id', 'name', 'position', 'organizationName']
    }) : [];
    
    const userMap = new Map(users.map(u => [u.id, u]));
    const attendees = attendeesRaw.map(a => {
      const u = userMap.get(a.userId);
      return {
        ...a,
        user_name: u?.name || '',
        position: u?.position || '',
        organization_name: u?.organizationName || ''
      };
    });

    const checklists = await this.dataSource.getRepository(HandoverChecklistEntity).find({ where: { handoverAssetId: id } });
    const logs = await this.dataSource.getRepository(HandoverLogEntity).find({ where: { handoverAssetId: id }, order: { createdAt: 'DESC' } });

    return {
      handover: {
        id: handover.id,
        program_id: handover.programId,
        event_name: handover.eventName,
        handover_date: handover.handoverDate,
        start_time: handover.startTime,
        end_time: handover.endTime,
        location: handover.location,
        event_type: handover.eventType,
        format: handover.format,
        notes: handover.notes,
        representative_name: handover.representativeName,
        representative_title: handover.representativeTitle,
        representative_phone: handover.representativePhone,
        representative_email: handover.representativeEmail,
        status: handover.status,
      },
      assets: assets.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        quantity: a.quantity,
        unit_price: a.unitPrice,
        amount_total: (a.unitPrice || 0) * (a.quantity || 0),
        status: a.status,
      })),
      attendees,
      checklists,
      logs,
    };
  }

  async saveHandoverDraft(id: number, userId?: string) {
    const handover = await this.handoverRepo.findOne({ where: { id } });
    if (!handover) throw new NotFoundException('Handover event not found');

    handover.status = 'DRAFT';
    await this.handoverRepo.save(handover);

    const log = this.dataSource.getRepository(HandoverLogEntity).create({
      handoverAssetId: id,
      createdById: userId,
      action: 'SAVE_DRAFT',
    });
    await this.dataSource.getRepository(HandoverLogEntity).save(log);

    return { success: true };
  }

  async updateHandoverStatus(id: number, status: string, userId?: string) {
    const handover = await this.handoverRepo.findOne({ where: { id } });
    if (!handover) throw new NotFoundException('Handover event not found');

    const oldStatus = handover.status;
    handover.status = status;
    await this.handoverRepo.save(handover);

    const log = this.dataSource.getRepository(HandoverLogEntity).create({
      handoverAssetId: id,
      createdById: userId,
      action: `UPDATE_STATUS: ${oldStatus} -> ${status}`,
    });
    await this.dataSource.getRepository(HandoverLogEntity).save(log);

    return { success: true };
  }

  async updateHandoverBatch(id: number, dto: UpdateHandoverDto, userId?: string) {
    return await this.dataSource.transaction(async (manager) => {
      const handover = await manager.findOne(HandoverAssetEntity, { where: { id } });
      if (!handover) throw new NotFoundException('Handover event not found');

      // 1. Update Handover Info
      const formatTime = (t?: string) => {
        if (!t) return undefined;
        if (t.length === 5) return `${t}:00`;
        return t;
      };

      handover.eventName = dto.event_name;
      handover.handoverDate = dto.handover_date ? new Date(dto.handover_date) : handover.handoverDate;
      handover.startTime = formatTime(dto.start_time) as any || handover.startTime;
      handover.endTime = formatTime(dto.end_time) as any || handover.endTime;
      handover.location = dto.location as any || handover.location;
      handover.eventType = dto.event_type || handover.eventType;
      handover.format = dto.format || handover.format;
      handover.notes = dto.notes as any || handover.notes;
      handover.representativeName = dto.representative_name as any || handover.representativeName;
      handover.representativeTitle = dto.representative_title as any || handover.representativeTitle;
      handover.representativePhone = dto.representative_phone as any || handover.representativePhone;
      handover.representativeEmail = dto.representative_email as any || handover.representativeEmail;
      handover.status = dto.status || handover.status;

      await manager.save(handover);

      // 2. Sync Assets (Clear old, set new)
      // 2. Sync Assets (Clear old, set new)
      await manager.update(AssetEntity, { handoverAssetId: id }, { handoverAssetId: null });
      if (dto.asset_ids && dto.asset_ids.length > 0) {
        // Ensure assets belong to the same program as the handover event
        await manager.update(AssetEntity, { 
          id: In(dto.asset_ids),
          programId: handover.programId 
        }, { handoverAssetId: id });
      }

      // 3. Replace Attendees
      await manager.delete(HandoverAttendeeEntity, { handoverAssetId: id });
      if (dto.attendees && dto.attendees.length > 0) {
        const attendees = dto.attendees.map((at) =>
          manager.create(HandoverAttendeeEntity, {
            handoverAssetId: id,
            userId: at.user_id,
            role: at.role,
          }),
        );
        await manager.save(attendees);
      }

      // 4. Replace Checklist
      await manager.delete(HandoverChecklistEntity, { handoverAssetId: id });
      const incomingChecklist = dto.checklist || dto.checklists;
      if (incomingChecklist && incomingChecklist.length > 0) {
        const checklists = incomingChecklist.map((cl) => {
          let type = cl.checklist_type;
          if (type === 'MANDATORY' || type === 'Bắt buộc') type = 'REQUIRED';
          if (type === 'Mở rộng') type = 'OPTIONAL';

          return manager.create(HandoverChecklistEntity, {
            handoverAssetId: id,
            name: cl.name,
            checklistType: type,
            isDone: cl.is_done || false,
          });
        });
        await manager.save(checklists);
      }

      // 5. Create Log
      const log = manager.create(HandoverLogEntity);
      log.handoverAssetId = id;
      log.createdById = userId;
      log.action = 'UPDATE_HANDOVER';
      await manager.save(log);

      return { success: true };
    });
  }

  async deleteHandoverBatch(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const handover = await manager.findOne(HandoverAssetEntity, { where: { id } });
      if (!handover) throw new NotFoundException('Handover event not found');

      // Restriction: Allow deletion of DRAFT, WAITING_PURCHASE, and WAITING_HANDOVER events
      const erasableStatuses = ['DRAFT', 'WAITING_PURCHASE', 'WAITING_HANDOVER'];
      if (!handover.status || !erasableStatuses.includes(handover.status)) {
        throw new BadRequestException('Chỉ có thể xóa lịch ở trạng thái Nháp, Chờ mua xong hoặc Chờ bàn giao');
      }

      // 1. Clear Assets links
      await manager.update(AssetEntity, { handoverAssetId: id }, { handoverAssetId: null });

      // 2. Delete related records
      await manager.delete(HandoverAttendeeEntity, { handoverAssetId: id });
      await manager.delete(HandoverChecklistEntity, { handoverAssetId: id });
      await manager.delete(HandoverLogEntity, { handoverAssetId: id });

      // 3. Delete handover event
      await manager.remove(handover);

      return { success: true };
    });
  }

  async toggleHandoverChecklist(checklistId: number, isDone: boolean, userId?: string) {
    const checklist = await this.dataSource.getRepository(HandoverChecklistEntity).findOne({ where: { id: checklistId } });
    if (!checklist) throw new NotFoundException('Checklist item not found');

    checklist.isDone = isDone;
    await this.dataSource.getRepository(HandoverChecklistEntity).save(checklist);

    // Create log for the handover event
    const log = this.dataSource.getRepository(HandoverLogEntity).create({
      handoverAssetId: checklist.handoverAssetId,
      createdById: userId,
      action: `CHECKLIST_${isDone ? 'DONE' : 'UNDONE'}: ${checklist.name}`,
    });
    await this.dataSource.getRepository(HandoverLogEntity).save(log);

    return { success: true };
  }

  // --- SUPPLIER MANAGEMENT ---

  async getSuppliers(query: SupplierListingQueryDto) {
    const { keyword, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.supplierRepo.createQueryBuilder('s');

    if (keyword) {
      qb.where('(s.name LIKE :keyword OR s.taxCode LIKE :keyword OR s.phone LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    qb.orderBy('s.name', 'ASC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { items, total, page, limit };
  }

  async getSupplierDetail(id: number) {
    const supplier = await this.supplierRepo.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async createSupplier(dto: CreateSupplierDto) {
    const supplier = this.supplierRepo.create({
      name: dto.name,
      taxCode: dto.tax_code,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      contactPerson: dto.contact_person,
      notes: dto.notes,
      supplierType: dto.supplier_type,
    });
    return await this.supplierRepo.save(supplier);
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto) {
    const supplier = await this.getSupplierDetail(id);
    Object.assign(supplier, {
      name: dto.name,
      taxCode: dto.tax_code,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      contactPerson: dto.contact_person,
      notes: dto.notes,
      supplierType: dto.supplier_type,
    });
    return await this.supplierRepo.save(supplier);
  }

  async deleteSupplier(id: number) {
    const supplier = await this.getSupplierDetail(id);
    await this.supplierRepo.remove(supplier);
    return { success: true };
  }

  async getSupplierSummary(programId: number) {
    const qb = this.assetRepo.createQueryBuilder('a')
      .leftJoin('a.supplierRelation', 's')
      .select('COALESCE(s.name, a.supplier, \'N/A\')', 'supplierName')
      .addSelect('a.supplierId', 'supplierId')
      .addSelect('SUM(a.unitPrice * a.quantity)', 'totalValue')
      .addSelect('COUNT(a.id)', 'assetCount')
      .where('a.programId = :programId', { programId })
      .groupBy('COALESCE(s.name, a.supplier, \'N/A\')')
      .addGroupBy('a.supplierId');

    const raw = await qb.getRawMany();

    // For each supplier, get a summary of their assets
    const items = await Promise.all(
      raw.map(async (row) => {
        // Get top 3 asset names for this supplier
        const assets = await this.assetRepo.find({
          where: {
            programId,
            supplierId: row.supplierId || IsNull(),
          },
          select: ['name', 'category'],
          take: 3,
        });

        const assetNames = assets.map((a) => a.name).join(', ');

        return {
          supplier: row.supplierName,
          supplier_id: row.supplierId,
          total_value: parseFloat(row.totalValue || '0'),
          asset_count: parseInt(row.assetCount || '0', 10),
          description: assetNames + (assets.length >= 3 ? '...' : ''),
          // Mocking some fields from the UI mockup or using logic
          status_text: row.supplierId ? 'Đã liên hệ' : 'Chưa liên hệ',
          initials: (row.supplierName || '??')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
        };
      }),
    );

    const totalContractValue = items.reduce((sum, item) => sum + item.total_value, 0);

    return {
      items,
      total_contract_value: totalContractValue,
    };
  }

  async searchUsers(query: UserSearchQueryDto) {
    const { keyword, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.userRepo.createQueryBuilder('u');

    if (keyword) {
      qb.where('(u.name LIKE :keyword OR u.username LIKE :keyword OR u.organizationName LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    qb.andWhere('u.status = 1'); // Only active users

    const [items, total] = await qb
      .select([
        'u.id',
        'u.name',
        'u.username',
        'u.position',
        'u.organizationName',
      ])
      .orderBy('u.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        full_name: u.name,
        position: u.position,
        organization_name: u.organizationName,
      })),
      total,
      page,
      limit,
    };
  }

  async exportAssets(programId: number, query: AssetListingQueryDto, res: Response) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException(`Program with ID ${programId} not found`);

    const { keyword, status } = query;
    const qb = this.assetRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.specifications', 's')
      .leftJoinAndSelect('a.attachments', 'at')
      .where('a.program_id = :programId', { programId });

    if (keyword) {
      qb.andWhere('(a.name LIKE :keyword OR a.code LIKE :keyword OR a.category LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (status) {
      qb.andWhere('a.status = :status', { status });
    }

    qb.orderBy('a.createdAt', 'DESC');
    const items = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách hiện vật');

    // Branding / Header
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'DANH SÁCH HẠNG MỤC HIỆN VẬT';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `Chương trình: ${program.name} (${program.code})`;
    sheet.getCell('A2').font = { italic: true };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Column Headers
    const headerRow = sheet.getRow(4);
    headerRow.values = [
      'STT',
      'Mã hiện vật',
      'Tên hiện vật',
      'Quy cách',
      'ĐVT',
      'Số lượng',
      'Đơn giá (VND)',
      'Thành tiền (VND)',
      'Trạng thái',
    ];

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF004A99' }, // PTSC Blue
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const statusMap = {
      RECEIVED: 'Đã tiếp nhận',
      IN_PROCUREMENT: 'Đang mua sắm',
      PURCHASED: 'Đã mua',
      SHIPPING: 'Đang vận chuyển',
      DELIVERED: 'Đã bàn giao',
    };

    let grandTotal = 0;

    items.forEach((item, idx) => {
      const specs = item.specifications?.map(s => `${s.parameter_name}: ${s.value}`).join('; ') || '';
      const amount = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
      grandTotal += amount;

      const row = sheet.addRow([
        idx + 1,
        item.code || '-',
        item.name,
        specs || '-',
        item.unit || '-',
        item.quantity || 0,
        Number(item.unitPrice || 0),
        amount,
        item.status ? (statusMap[item.status as keyof typeof statusMap] || item.status) : '-',
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      row.getCell(6).alignment = { horizontal: 'center' };
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '#,##0';
    });

    // Summary Row
    const totalRow = sheet.addRow(['', '', '', '', '', '', 'TỔNG CỘNG', grandTotal, '']);
    totalRow.font = { bold: true };
    totalRow.getCell(8).numFmt = '#,##0';
    totalRow.eachCell((cell, colNumber) => {
      if (colNumber >= 7 && colNumber <= 8) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });

    // Column Widths
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 40;
    sheet.getColumn(5).width = 10;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 15;
    sheet.getColumn(8).width = 15;
    sheet.getColumn(9).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=DanhSachHienVat_${program.code}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
