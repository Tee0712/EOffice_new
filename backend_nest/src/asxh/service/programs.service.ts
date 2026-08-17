import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial, DataSource } from 'typeorm';
import { ProgramEntity } from '../entities/program.entity';
import { AssetEntity } from '../entities/asset.entity';
import { Department2Entity } from '../entities/department2.entity';
import { ProgramMemberEntity } from '../entities/program-member.entity';
import { ProgramItemEntity } from '../entities/program-item.entity';
import { ProgramMilestoneEntity } from '../entities/program-milestone.entity';
import { ProgramAttachmentEntity } from '../entities/program-attachment.entity';
// @ts-ignore
import { ProgramDocumentEntity } from '../entities/program-document.entity';
import { CreateProgramDto } from '../dto/create-program.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { DisbursementEntity } from '../entities/disbursement.entity';
import { DisbursementLogEntity } from '../entities/disbursement-log.entity';
import { DisbursementReceiverEntity } from '../entities/disbursement-receiver.entity';
import { DisbursementDetailEntity } from '../entities/disbursement-detail.entity';
import { getMssqlPool } from 'src/database/mssql.pool';
import * as sql from 'mssql';
const ExcelJS = require('exceljs');

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);
  private readonly logFile = path.resolve(process.cwd(), 'app_error.log');

  private logToFile(msg: string) {
    fs.appendFileSync(this.logFile, `[${new Date().toISOString()}] ${msg}\n`);
  }
  constructor(
    @InjectRepository(ProgramEntity, 'mssqlConnection')
    private readonly programRepo: Repository<ProgramEntity>,
    @InjectRepository(Department2Entity, 'mssqlConnection')
    private readonly department2Repo: Repository<Department2Entity>,
    @InjectRepository(ProgramMemberEntity, 'mssqlConnection')
    private readonly programMemberRepo: Repository<ProgramMemberEntity>,
    @InjectRepository(ProgramItemEntity, 'mssqlConnection')
    private readonly programItemRepo: Repository<ProgramItemEntity>,
    @InjectRepository(ProgramMilestoneEntity, 'mssqlConnection')
    private readonly programMilestoneRepo: Repository<ProgramMilestoneEntity>,
    @InjectRepository(ProgramAttachmentEntity, 'mssqlConnection')
    private readonly programAttachmentRepo: Repository<ProgramAttachmentEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(DisbursementEntity, 'mssqlConnection')
    private readonly disbursementRepo: Repository<DisbursementEntity>,
    @InjectRepository(DisbursementLogEntity, 'mssqlConnection')
    private readonly disbursementLogRepo: Repository<DisbursementLogEntity>,
    @InjectRepository(DisbursementReceiverEntity, 'mssqlConnection')
    private readonly disbursementReceiverRepo: Repository<DisbursementReceiverEntity>,
    @InjectRepository(ProgramDocumentEntity, 'mssqlConnection')
    private readonly programDocumentRepo: Repository<ProgramDocumentEntity>,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) { }

  async getDepartments2(): Promise<Department2Entity[]> {
    return this.department2Repo.find({
      order: { name: 'ASC' },
    });
  }

  async generateCode(fundingType: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${fundingType}-${year}`;

    // Find the latest code with this prefix
    const latest = await this.programRepo
      .createQueryBuilder('p')
      .where('p.code LIKE :prefix', { prefix: `${prefix}-%` })
      .orderBy('p.id', 'DESC')
      .getOne();

    let seq = 1;
    if (latest && latest.code) {
      const parts = latest.code.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}-${seq.toString().padStart(4, '0')}`;
  }

  async create(dto: CreateProgramDto): Promise<ProgramEntity> {
    const { action, dispatch_ids, members, items, milestones, linked_documents, ...rest } = dto;

    // Auto-generate code if not provided
    if (!rest.code) {
      rest.code = await this.generateCode(dto.funding_type || 'Bang_tien');
    }

    const program = this.programRepo.create({
      ...rest,
      funding_type: dto.funding_type,
      status: action === 'SUBMIT' ? 'dang_trien_khai' : 'lap_ke_hoach',
      created_at: new Date(),
      updated_at: new Date(),
      start_date: (dto.start_date && !isNaN(Date.parse(dto.start_date))) ? new Date(dto.start_date) : null,
      end_date: (dto.end_date && !isNaN(Date.parse(dto.end_date))) ? new Date(dto.end_date) : null,
    } as DeepPartial<ProgramEntity>);

    this.logToFile(`Program payload: ${JSON.stringify(program)}`);
    try {
      const savedProgram = await this.programRepo.save(program);

      // Lưu danh sách thành viên
      if (members && members.length > 0) {
        const memberEntities = members.map(m => this.programMemberRepo.create({
          program_id: savedProgram.id,
          user_id: m.user_id,
          role: m.role || 'MEMBER'
        }));
        await this.programMemberRepo.save(memberEntities);
      }

      // Lưu hạng mục chi
      if (items && items.length > 0) {
        const itemEntities = items.map(i => this.programItemRepo.create({
          program_id: savedProgram.id,
          name: i.name,
          unit_price: i.unit_price,
          quantity: i.quantity
        }));
        await this.programItemRepo.save(itemEntities);
      }

      // Lưu mốc triển khai
      if (milestones && milestones.length > 0) {
        const milestoneEntities = milestones
          .filter(m => m.milestone_name && m.milestone_date && !isNaN(Date.parse(m.milestone_date)))
          .map(m => this.programMilestoneRepo.create({
            program_id: savedProgram.id,
            milestone_name: m.milestone_name,
            milestone_date: new Date(m.milestone_date),
            milestone_type: m.milestone_type || 'MANDATORY'
          }));
        if (milestoneEntities.length > 0) {
          await this.programMilestoneRepo.save(milestoneEntities);
        }
      }

      // Lưu văn bản liên kết vào bảng program_documents
      if (linked_documents && linked_documents.length > 0) {
        const docEntities = linked_documents
          .filter(doc => {
            const id = Number(doc.document_id);
            return !isNaN(id) && id > 0;
          })
          .map(doc => this.programDocumentRepo.create({
            programId: savedProgram.id,
            documentId: String(doc.document_id), // convert to string for bigint
            documentCode: doc.document_code || '',
            documentSubject: doc.document_subject || ''
          }));
        if (docEntities.length > 0) {
          try {
            await this.programDocumentRepo.save(docEntities);
          } catch (docError) {
            this.logger.error(`Error saving program documents: ${docError.message}`, docError.stack);
            throw docError;
          }
        }
      }

      return savedProgram;
    } catch (error) {
      this.logToFile(`Error creating program: ${error.message}\nStack: ${error.stack}`);
      this.logger.error(`Error creating program: ${error.message}`, error.stack);
      // Rollback: xoá program nếu lỗi
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.programRepo.delete(id);
  }

  async update(id: number, dto: any): Promise<ProgramEntity> {
    const { members, items, milestones, linked_documents, ...rest } = dto;
    
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // 1. Update main program entity (Whitelist approach)
    const validColumns = [
      'funding_type', 'code', 'status', 'name', 'description', 
      'locality', 'specific_address', 'start_date', 'end_date', 
      'local_partner', 'beneficiary', 'classification_keywords', 'funding_source'
    ];
    
    const updateData: any = {};
    validColumns.forEach(col => {
      if (rest[col] !== undefined) {
        updateData[col] = rest[col];
      }
    });

    this.logger.log(`Updating Program ${id}. Validating columns: ${Object.keys(updateData).join(', ')}`);

    // Special handling for dates to ensure they are Date objects
    if (updateData.start_date && typeof updateData.start_date === 'string' && !isNaN(Date.parse(updateData.start_date))) {
      updateData.start_date = new Date(updateData.start_date);
    }
    if (updateData.end_date && typeof updateData.end_date === 'string' && !isNaN(Date.parse(updateData.end_date))) {
      updateData.end_date = new Date(updateData.end_date);
    }
    updateData.updated_at = new Date();

    await this.programRepo.update(id, updateData);

    // 2. Sync Members (Delete and Re-insert)
    if (members) {
      await this.programMemberRepo.delete({ program_id: id });
      if (members.length > 0) {
        const memberEntities = members.map(m => this.programMemberRepo.create({
          program_id: id,
          user_id: m.user_id,
          role: m.role || 'MEMBER'
        }));
        await this.programMemberRepo.save(memberEntities);
      }
    }

    // 3. Sync Items (Match by ID)
    if (items) {
      const existingItems = await this.programItemRepo.find({ where: { program_id: id } });
      const dtoItemIds = items.map(i => Number(i.id)).filter(id => !isNaN(id) && id > 0);

      // Remove items not in DTO
      for (const exItem of existingItems) {
        if (!dtoItemIds.includes(exItem.id)) {
           // Safe delete: only if no disbursements linked
           const disCount = await this.disbursementRepo.count({ where: { programItemId: exItem.id } });
           if (disCount === 0) {
             await this.programItemRepo.delete(exItem.id);
           } else {
             this.logger.warn(`Skip deleting item ${exItem.id} (Program ${id}) because it has ${disCount} disbursements.`);
           }
        }
      }

      // Update or Create
      for (const item of items) {
        const itemPayload = {
          name: item.name,
          unit_price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 0
        };

        if (item.id && !isNaN(Number(item.id)) && Number(item.id) > 0) {
          await this.programItemRepo.update(item.id, itemPayload);
        } else {
          await this.programItemRepo.save(this.programItemRepo.create({
            ...itemPayload,
            program_id: id
          }));
        }
      }
    }

    // 4. Sync Milestones (Delete and Re-insert)
    if (milestones) {
      await this.programMilestoneRepo.delete({ program_id: id });
      const milestoneEntities = milestones
        .filter(m => m.milestone_name && m.milestone_date && !isNaN(Date.parse(m.milestone_date)))
        .map(m => this.programMilestoneRepo.create({
          program_id: id,
          milestone_name: m.milestone_name,
          milestone_date: new Date(m.milestone_date),
          milestone_type: m.milestone_type || 'MANDATORY'
        }));
      if (milestoneEntities.length > 0) {
        await this.programMilestoneRepo.save(milestoneEntities);
      }
    }

    // 5. Sync Documents
    if (linked_documents) {
      await this.programDocumentRepo.delete({ programId: id });
      const docEntities = linked_documents
        .filter(doc => Number(doc.document_id) > 0)
        .map(doc => this.programDocumentRepo.create({
          programId: id,
          documentId: String(doc.document_id),
          documentCode: doc.document_code || '',
          documentSubject: doc.document_subject || ''
        }));
      if (docEntities.length > 0) {
        await this.programDocumentRepo.save(docEntities);
      }
    }

    return this.findOne(id);
  }

  async findAll(query: any): Promise<any> {
    try {
      const { keyword, funding_type, status, locality, year } = query;
      const page = Number(query.page) || 1;
      const limit = Number(query.page_size) || 8;
      const skip = (page - 1) * limit;

      const queryBuilder = this.programRepo.createQueryBuilder('p')
        .addSelect(subQuery => {
          return subQuery
            .select('SUM(COALESCE(pi.unit_price, 0) * COALESCE(pi.quantity, 0))', 'budget')
            .from(ProgramItemEntity, 'pi')
            .where('pi.program_id = p.id');
        }, 'budget')
        .addSelect(subQuery => {
          return subQuery
            .select('SUM(COALESCE(dd.amount, 0))', 'disbursed_total')
            .from('disbursement_details', 'dd')
            .innerJoin('disbursements', 'd', 'dd.disbursement_id = d.id')
            .innerJoin('program_items', 'pi', 'd.program_item_id = pi.id')
            .where('pi.program_id = p.id')
            .andWhere("d.status = 'COMPLETED'");
        }, 'disbursed_total')
        .addSelect(subQuery => {
          return subQuery
            .select('SUM(COALESCE(a.unit_price * a.quantity, 0))', 'asset_purchased_total')
            .from('assets', 'a')
            .where('a.program_id = p.id')
            .andWhere("a.status IN ('PURCHASED', 'SHIPPING', 'DELIVERED')");
        }, 'asset_purchased_total');

      // Helper function-like application of filters
      const applyAllFilters = (qb: any) => {
        if (query.id) {
          qb.andWhere('p.id = :id', { id: Number(query.id) });
          // If we filter by ID, we don't need other filters usually, but we keep them for flexibility
        }
        if (keyword) {
          qb.andWhere('(p.name LIKE :keyword OR p.code LIKE :keyword)', { keyword: `%${keyword}%` });
        }
        if (funding_type && funding_type !== 'all') {
          qb.andWhere('p.funding_type = :funding_type', { funding_type });
        }
        if (status && status !== 'all') {
          qb.andWhere('p.status = :status', { status });
        }
        if (locality) {
          qb.andWhere('p.locality LIKE :locality', { locality: `%${locality}%` });
        }
        if (year && year !== 'all') {
          qb.andWhere('YEAR(p.start_date) = :year', { year: Number(year) });
        }
      };

      applyAllFilters(queryBuilder);



      queryBuilder
        .orderBy('p.created_at', 'DESC');

      // For total count for pagination, we need a clone of the queryBuilder before skip/take
      const total = await queryBuilder.getCount();

      queryBuilder
        .skip(skip)
        .take(limit);

      const { entities, raw } = await queryBuilder.getRawAndEntities();

      const mergedItems = entities.map((entity, index) => {
        const rawItem = raw.find(r => r.p_id === entity.id);
        const budget = Number(rawItem?.budget || 0);
        const asset_purchased_total = Number(rawItem?.asset_purchased_total || 0);
        const manual_disbursed_total = Number(rawItem?.disbursed_total || 0);
        
        // Final disbursed total is the sum of manual disbursements + purchased assets
        const disbursed_total = manual_disbursed_total + asset_purchased_total;
        
        const progress_percent = budget > 0 ? Math.round((disbursed_total / budget) * 100) : 0;

        return {
          ...entity,
          budget,
          disbursed_total,
          progress_percent,
        };
      });


      // Enhanced summary that respects filters
      const totalBudgetRaw = await this.programRepo.createQueryBuilder('p')
        .innerJoin(ProgramItemEntity, 'pi', 'pi.program_id = p.id')
        .select('SUM(COALESCE(pi.unit_price, 0) * COALESCE(pi.quantity, 0))', 'total_budget')
        .where(qb => {
          applyAllFilters(qb);
        })
        .getRawOne();

      const statusCountsRaw = await this.programRepo.createQueryBuilder('p')
        .select('p.status', 'status')
        .addSelect('COUNT(p.id)', 'count')
        .where(qb => {
          applyAllFilters(qb);
        })
        .groupBy('p.status')
        .getRawMany();

      const summary = {
        total_programs: total,
        total_budget: Number(totalBudgetRaw?.total_budget || 0),
        lap_ke_hoach: Number(statusCountsRaw.find(s => s.status === 'lap_ke_hoach')?.count || 0),
        dang_trien_khai: Number(statusCountsRaw.find(s => s.status === 'dang_trien_khai')?.count || 0),
        dang_giai_ngan: Number(statusCountsRaw.find(s => s.status === 'dang_giai_ngan')?.count || 0),
        hoan_thanh: Number(statusCountsRaw.find(s => s.status === 'hoan_thanh')?.count || 0),
      };

      return {
        items: mergedItems,
        pagination: {
          total,
          page,
          page_size: limit,
          total_pages: Math.ceil(total / limit),
        },
        summary,
      };
    } catch (error) {
      this.logger.error(`Error finding all programs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      this.logger.log(`Fetching full detail for Program ID ${id}`);

      // 1. Fetch main entity
      const p = await this.programRepo.findOne({ where: { id: Number(id) } });
      if (!p) throw new NotFoundException('Chương trình không tồn tại');

      // 2. Fetch financial totals (Separate queries for robustness)
      const budgetRaw = await this.programItemRepo.createQueryBuilder('pi')
        .select('SUM(CAST(ISNULL(pi.unit_price * pi.quantity, 0) AS DECIMAL(18,2)))', 'total')
        .where('pi.program_id = :id', { id })
        .getRawOne();
      const budget = Number(budgetRaw?.total) || 0;

      const disbursedRaw = await this.programItemRepo.createQueryBuilder('pi')
        .innerJoin('pi.disbursements', 'd')
        .innerJoin('d.details', 'dd')
        .select('SUM(CAST(ISNULL(dd.amount, 0) AS DECIMAL(18,2)))', 'total')
        .where('pi.program_id = :id', { id })
        .andWhere("d.status = 'COMPLETED'")
        .getRawOne();
      const manual_disbursed_total = Number(disbursedRaw?.total) || 0;

      // Add purchased assets total for in-kind programs
      const assetPurchasedRaw = await this.dataSource.getRepository(AssetEntity).createQueryBuilder('a')
        .select('SUM(CAST(ISNULL(a.unit_price * a.quantity, 0) AS DECIMAL(18,2)))', 'total')
        .where('a.program_id = :id', { id })
        .andWhere("a.status IN ('PURCHASED', 'SHIPPING', 'DELIVERED')")
        .getRawOne();
      const asset_purchased_total = Number(assetPurchasedRaw?.total) || 0;

      const disbursed_total = manual_disbursed_total + asset_purchased_total;

      // 3. Fetch related sub-entities (Robustly handled)
      let items: ProgramItemEntity[] = [];
      try {
        items = await this.programItemRepo.find({ where: { program_id: id } });
      } catch (e) {
        this.logger.error(`Error fetching items for Program ${id}: ${e.message}`);
      }

      let milestones: ProgramMilestoneEntity[] = [];
      try {
        milestones = await this.programMilestoneRepo.find({
          where: { program_id: id },
          order: { milestone_date: 'ASC' }
        });
      } catch (e) {
        this.logger.error(`Error fetching milestones for Program ${id}: ${e.message}`);
      }

      let linked_documents: ProgramDocumentEntity[] = [];
      try {
        linked_documents = await this.programDocumentRepo.find({ where: { programId: id } });
      } catch (e) {
        this.logger.error(`Error fetching documents for Program ${id}: ${e.message}`);
      }

      let members: any[] = [];
      try {
        const membersRaw = await this.programMemberRepo.find({ where: { program_id: id } });
        members = await Promise.all(membersRaw.map(async (m) => {
          try {
            const user = await this.userRepo.findOne({ where: { id: m.user_id } });
            return { ...m, user_name: user?.name || 'N/A' };
          } catch {
            return { ...m, user_name: 'N/A' };
          }
        }));
      } catch (e) {
        this.logger.error(`Error fetching members for Program ${id}: ${e.message}`);
      }

      // Detailed disbursements
      let disbursements: any[] = [];
      try {
        const disbursementsRaw = await this.disbursementRepo.createQueryBuilder('d')
          .innerJoinAndSelect('d.programItem', 'pi')
          .where('pi.program_id = :id', { id })
          .orderBy('d.created_at', 'DESC')
          .getMany();

        disbursements = await Promise.all(disbursementsRaw.map(async (d) => {
          const receiver_name = d.receiving_unit || 'N/A';
          // receiver_id was invalid column - keep it safe
          return { ...d, receiver_name };
        }));
      } catch (e) {
        this.logger.error(`Error fetching disbursements for Program ${id}: ${e.message}`);
      }

      // 4. Combined Activity Feed (Milestones + Log entries)
      let activities: any[] = milestones.map(m => ({
        type: 'MILESTONE',
        title: m.milestone_name,
        date: m.milestone_date,
        status: m.milestone_type || 'Kế hoạch',
        owner: null,
        details: null
      }));

      try {
        const logs = await this.disbursementLogRepo.createQueryBuilder('log')
          .innerJoin('log.disbursement', 'd')
          .innerJoin('d.programItem', 'pi')
          .where('pi.program_id = :id', { id })
          .orderBy('log.created_at', 'DESC')
          .getMany();

        activities = [
          ...activities,
          ...logs.map(l => ({
            type: 'LOG',
            title: l.action,
            date: l.created_at,
            status: 'Hoàn thành',
            owner: l.senderId,
            details: l.note
          }))
        ];
      } catch (e) {
        this.logger.error(`[ProgramsService.findOne] Log fetch error for ID ${id}`, e);
      }

      // Safe sorting (handles null/undefined dates)
      activities.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      // 5. Final flat object construction
      return {
        ...p,
        status: p.status || 'lap_ke_hoach',
        budget,
        disbursed_total,
        remaining_amount: budget - disbursed_total,
        item_count: items.length,
        item_completed_count: items.filter(i => {
          // Heuristic for UI purposes
          return false;
        }).length,
        progress_percent: budget > 0 ? Math.floor((disbursed_total / budget) * 100) : 0,
        items,
        milestones,
        members,
        linked_documents,
        disbursements,
        activities
      };
    } catch (error) {
      this.logger.error(`[ProgramsService.findOne ERROR] ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Truy vấn danh sách văn bản đến từ bảng incomming_documents_sync (Local DB)
   */
  async searchIncomingDocuments(page: number, limit: number, keyword?: string): Promise<any> {
    try {
      const pool = await getMssqlPool(this.configService);
      const dbName = this.configService.get<string>('SQLSERVER_DATABASE') || 'eoffice_ptsc';

      const offset = (page - 1) * limit;
      this.logger.log(`Searching documents: dbName=${dbName}, table=incomming_documents_sync, page=${page}, limit=${limit}, offset=${offset}, keyword=${keyword}`);

      let whereClause = '';
      const request = pool.request();
      if (keyword) {
        whereClause = `WHERE (SoDen LIKE @keyword OR Title LIKE @keyword OR ID LIKE @keyword OR CoQuanGuiText LIKE @keyword)`;
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
      }

      // Đếm tổng số
      const countResult = await request.query(`SELECT COUNT(*) as total FROM ${dbName}.dbo.incomming_documents_sync ${whereClause}`);
      const total = countResult.recordset[0].total;
      this.logger.log(`Total documents found: ${total}`);

      // Lấy dữ liệu phân trang
      const rowsResult = await request
        .input('limit', sql.Int, limit)
        .input('offset', sql.Int, offset)
        .query(`
          SELECT 
            ID as id,
            SoDen as to_book,
            Title as abstract_note,
            Created as document_date,
            CoQuanGuiText as sender
          FROM ${dbName}.dbo.incomming_documents_sync
          ${whereClause}
          ORDER BY ID DESC
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

      this.logger.log(`SQL result rows: ${rowsResult.recordset.length}`);

      return {
        success: true,
        items: rowsResult.recordset,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Error searching incoming documents sync: ${error.message}`, error.stack);
      return { success: false, items: [], total: 0, message: error.message };
    }
  }

  async exportExcel(query: any): Promise<any> {
    const { items } = await this.findAll({ ...query, page: 1, page_size: 1000 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách chương trình');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 5 },
      { header: 'Mã chương trình', key: 'code', width: 20 },
      { header: 'Tên chương trình', key: 'name', width: 40 },
      { header: 'Loại hình', key: 'funding_type', width: 15 },
      { header: 'Địa phương', key: 'locality', width: 20 },
      { header: 'Ngân sách (VNĐ)', key: 'budget', width: 20 },
      { header: 'Đã giải ngân (VNĐ)', key: 'disbursed_total', width: 20 },
      { header: 'Tiến độ (%)', key: 'progress_percent', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 20 },
      { header: 'Ngày bắt đầu', key: 'start_date', width: 15 },
      { header: 'Ngày kết thúc', key: 'end_date', width: 15 },
    ];

    items.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        code: item.code,
        name: item.name,
        funding_type: item.funding_type,
        locality: item.locality,
        budget: item.budget,
        disbursed_total: item.disbursed_total,
        progress_percent: item.progress_percent,
        status: item.status,
        start_date: item.start_date ? item.start_date.split("-").reverse().join("-") : '',
        end_date: item.end_date ? item.end_date.split("-").reverse().join("-") : '',
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
