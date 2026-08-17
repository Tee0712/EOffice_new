import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ProgramEntity } from '../entities/program.entity';
import { ProgramItemEntity } from '../entities/program-item.entity';
import { DisbursementEntity } from '../entities/disbursement.entity';
import { DisbursementDetailEntity } from '../entities/disbursement-detail.entity';
import { DisbursementAttachmentEntity } from '../entities/disbursement-attachment.entity';
import { DisbursementLogEntity } from '../entities/disbursement-log.entity';
import { ProgramDisbursementSequenceEntity } from '../entities/program-disbursement-sequence.entity';
import { DisbursementReceiverEntity } from '../entities/disbursement-receiver.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { WorkflowWizardService } from './workflow-wizard.service';
import { ModuleWorkflowConfigService } from './module-workflow-config.service';
import { RuntimeDbService } from 'src/bpmn/runtime-dbmssql.service';
import {
  DisbursementOverviewQueryDto,
  DisbursementTimelineQueryDto,
  ConfirmSubmitDto,
  SearchReceiversQueryDto,
  CreateReceiverDto,
  BudgetCheckDto,
  CreateDisbursementDto,
  UpdateDisbursementDto,
  UpdateDisbursementStatusDto,
} from '../dto/asxh.dto';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AsxhService {
  constructor(
    @InjectRepository(ProgramEntity, 'mssqlConnection')
    private readonly programRepo: Repository<ProgramEntity>,
    @InjectRepository(ProgramItemEntity, 'mssqlConnection')
    private readonly programItemRepo: Repository<ProgramItemEntity>,
    @InjectRepository(DisbursementEntity, 'mssqlConnection')
    private readonly disbursementRepo: Repository<DisbursementEntity>,
    @InjectRepository(DisbursementAttachmentEntity, 'mssqlConnection')
    private readonly attachmentRepo: Repository<DisbursementAttachmentEntity>,
    @InjectRepository(DisbursementReceiverEntity, 'mssqlConnection')
    private readonly receiverRepo: Repository<DisbursementReceiverEntity>,
    @InjectRepository(ProgramDisbursementSequenceEntity, 'mssqlConnection')
    private readonly sequenceRepo: Repository<ProgramDisbursementSequenceEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    private readonly workflowWizardService: WorkflowWizardService,
    private readonly moduleWorkflowConfigService: ModuleWorkflowConfigService,
    private readonly runtimeDbService: RuntimeDbService,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
  ) { }

  async getStatuses() {
    return [
      { value: 'COMPLETED', label: 'Hoàn thành' },
      { value: 'DISBURSED', label: 'Đã chi tiền' },
      { value: 'APPROVED', label: 'Đã duyệt' },
      { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
      { value: 'REJECTED', label: 'Từ chối' },
      { value: 'DRAFT', label: 'Nháp' },
    ];
  }

  async getOverview(programId: number, query: DisbursementOverviewQueryDto) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException(`Program with ID ${programId} not found`);

    const { keyword, status, sort, page, limit } = query;
    const skip = (page - 1) * limit;

    // 1. Calculate KPIs using Promise.all for efficiency
    const [kpi, disbursementsData] = await Promise.all([
      this.calculateKPIs(programId),
      this.getDisbursementsList(programId, keyword, status, sort, skip, limit),
    ]);

    return {
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        locality: program.locality,
        specific_address: program.specific_address,
        start_date: program.start_date,
        end_date: program.end_date,
      },
      kpi,
      disbursements: disbursementsData,
    };
  }

  private async calculateKPIs(programId: number) {
    // 1. Total Budget & Items Count
    const budgetResult = await this.programItemRepo
      .createQueryBuilder('pi')
      .select('SUM(pi.unit_price * pi.quantity)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('pi.program_id = :programId', { programId })
      .getRawOne();

    const totalBudget = parseFloat(budgetResult?.total || 0);
    const itemsCount = parseInt(budgetResult?.count || 0, 10);

    // 2. Aggregate Disbursements by status (Count and Sum of amount)
    const amounts = await this.dataSource.createQueryBuilder()
      .select('d.status', 'status')
      .addSelect('COUNT(DISTINCT d.id)', 'count')
      .addSelect('SUM(dd.amount)', 'total')
      .from(DisbursementEntity, 'd')
      .leftJoin(DisbursementDetailEntity, 'dd', 'dd.disbursementId = d.id')
      .innerJoin(ProgramItemEntity, 'pi', 'pi.id = d.programItemId')
      .where('pi.program_id = :programId', { programId })
      .groupBy('d.status')
      .getRawMany();

    let disbursedAmount = 0;
    let disbursedCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let totalDisbursements = 0;

    amounts.forEach(row => {
      const val = parseFloat(row.total || 0);
      const cnt = parseInt(row.count || 0, 10);
      totalDisbursements += cnt;
      if (['COMPLETED', 'DISBURSED', 'APPROVED'].includes(row.status)) {
        disbursedAmount += val;
        disbursedCount += cnt;
      } else if (['PENDING_APPROVAL', 'DRAFT'].includes(row.status)) {
        pendingAmount += val;
        pendingCount += cnt;
      }
    });

    const remainingAmount = totalBudget - disbursedAmount - pendingAmount;

    // 3. Metadata for UI (Label of the latest pending item)
    let pendingLabel = '';
    if (pendingCount > 0) {
      const lastPending = await this.disbursementRepo.createQueryBuilder('d')
        .innerJoin('d.programItem', 'pi')
        .where('pi.program_id = :programId', { programId })
        .andWhere('d.status IN (:...statuses)', { statuses: ['PENDING_APPROVAL', 'DRAFT'] })
        .orderBy('d.id', 'DESC')
        .getOne();

      if (lastPending) {
        const seq = await this.disbursementRepo.createQueryBuilder('d')
          .innerJoin('d.programItem', 'pi')
          .where('pi.program_id = :programId', { programId })
          .andWhere('d.id <= :id', { id: lastPending.id })
          .getCount();
        pendingLabel = `Đợt ${seq} đang chờ duyệt`;
      }
    }

    return {
      total_budget: totalBudget,
      items_count: itemsCount,
      total_disbursements: totalDisbursements,
      disbursed_amount: disbursedAmount,
      disbursed_count: disbursedCount,
      pending_amount: pendingAmount,
      pending_count: pendingCount,
      pending_label: pendingLabel,
      remaining_amount: remainingAmount,
      percentages: {
        disbursed: totalBudget > 0 ? parseFloat(((disbursedAmount / totalBudget) * 100).toFixed(1)) : 0,
        pending: totalBudget > 0 ? parseFloat(((pendingAmount / totalBudget) * 100).toFixed(1)) : 0,
        remaining: totalBudget > 0 ? parseFloat(((remainingAmount / totalBudget) * 100).toFixed(1)) : 0,
      },
    };
  }

  private async getDisbursementsList(programId: number, keyword?: string, status?: string, sort?: string, skip: number = 0, limit: number = 20) {
    const qb = this.disbursementRepo.createQueryBuilder('d')
      .leftJoinAndSelect('d.attachments', 'a')
      .innerJoin(ProgramItemEntity, 'pi', 'pi.id = d.programItemId')
      .where('pi.program_id = :programId', { programId });

    if (keyword) {
      qb.andWhere('(d.disbursement_content LIKE :keyword OR d.receiving_unit LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    if (status) {
      qb.andWhere('d.status = :status', { status });
    }

    // Default sort: expected_transfer_date DESC
    if (sort === 'expected_transfer_date_asc') {
      qb.orderBy('d.expected_transfer_date', 'ASC');
    } else {
      qb.orderBy('d.expected_transfer_date', 'DESC');
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Luôn lấy luồng động mới nhất cho toàn bộ danh sách
    const dynamicWorkflowKey = await this.getASXHWorkflowKey();

    // Map to include amount_total (efficiency note: could be done via secondary query or join aggregation)
    const itemsWithTotals = await Promise.all(items.map(async (item) => {
      const amountResult = await this.dataSource.getRepository(DisbursementDetailEntity)
        .createQueryBuilder('dd')
        .select('SUM(dd.amount)', 'total')
        .where('dd.disbursement_id = :id', { id: item.id })
        .getRawOne();

      return {
        ...item,
        workflowKey: dynamicWorkflowKey || item.workflowKey,
        amount_total: parseFloat(amountResult?.total || 0),
        // Derive correct step from status (fixes legacy data with wrong step)
        current_step_order: this.deriveStepFromStatus(
          item.status || 'DRAFT',
          item.current_step_order || 1
        ),
      };
    }));

    return {
      items: itemsWithTotals,
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
    };
  }

  /**
   * Helper để lấy phím quy trình phê duyệt động cho module ASXH
   */
  private async getASXHWorkflowKey(): Promise<string | null> {
    try {
      // Ưu tiên tra cứu theo mã Code chuẩn
      const key = await this.moduleWorkflowConfigService.getWorkflowKeyByMenuCode('ASXH_ROOT');
      if (key) return key;

      // Backup: Nếu không thấy theo Code, thử tra cứu trực tiếp theo ID asxh_root_001
      return await this.moduleWorkflowConfigService.getWorkflowKeyByMenuId('asxh_root_001');
    } catch (error) {
      console.error('[AsxhService] Error fetching dynamic workflow key:', error);
      return null;
    }
  }

  async getDetail(disbursementId: number) {
    const disbursement = await this.disbursementRepo.findOne({
      where: { id: disbursementId },
      relations: ['details', 'attachments', 'receiver', 'programItem'],
    });

    if (!disbursement) throw new NotFoundException(`Disbursement with ID ${disbursementId} not found`);

    // Tra cứu luồng động mới nhất
    const dynamicWorkflowKey = await this.getASXHWorkflowKey();

    return {
      disbursement: {
        id: disbursement.id,
        disbursement_content: disbursement.disbursement_content,
        detailed_description: disbursement.detailed_description,
        expected_transfer_date: disbursement.expected_transfer_date,
        receiving_unit: disbursement.receiving_unit,
        notification_type: disbursement.notification_type,
        status: disbursement.status,
        current_step_order: this.deriveStepFromStatus(
          disbursement.status || 'DRAFT',
          disbursement.current_step_order || 1
        ),
        workflow_key: dynamicWorkflowKey || disbursement.workflowKey, // Ưu tiên luồng động
        program_item_id: disbursement.programItemId,
        program_item: disbursement.programItem ? {
          id: disbursement.programItem.id,
          name: disbursement.programItem.name,
        } : null,
        receiver_id: disbursement.receiver_id,
        receiver: disbursement.receiver ? {
          id: disbursement.receiver.id,
          name: disbursement.receiver.name,
          tax_code: disbursement.receiver.tax_code,
          bank_name: disbursement.receiver.bank_name,
          bank_account_number: disbursement.receiver.bank_account_number,
          bank_branch: disbursement.receiver.bank_branch,
          bank_account_holder: disbursement.receiver.bank_account_holder,
        } : null,
      },
      details: disbursement.details,
      attachments: disbursement.attachments,
    };
  }



  async getTimeline(programId: number, query: DisbursementTimelineQueryDto) {
    const { status, from_date, to_date, sort } = query;

    const qb = this.disbursementRepo.createQueryBuilder('d')
      .innerJoin(ProgramItemEntity, 'pi', 'pi.id = d.program_item_id')
      .where('pi.program_id = :programId', { programId });

    if (status) qb.andWhere('d.status = :status', { status });
    if (from_date) qb.andWhere('d.expected_transfer_date >= :from_date', { from_date });
    if (to_date) qb.andWhere('d.expected_transfer_date <= :to_date', { to_date });

    if (sort === 'expected_transfer_date_asc') {
      qb.orderBy('d.expected_transfer_date', 'ASC');
    } else {
      qb.orderBy('d.expected_transfer_date', 'DESC');
    }

    const items = await qb.getMany();

    const result = await Promise.all(items.map(async (item) => {
      const amountResult = await this.dataSource.getRepository(DisbursementDetailEntity)
        .createQueryBuilder('dd')
        .select('SUM(dd.amount)', 'total')
        .where('dd.disbursement_id = :id', { id: item.id })
        .getRawOne();

      return {
        disbursement_id: item.id,
        disbursement_content: item.disbursement_content,
        expected_transfer_date: item.expected_transfer_date,
        amount_total: parseFloat(amountResult?.total || 0),
        status: item.status,
      };
    }));

    return result;
  }

  async uploadAttachments(disbursementId: number, title: string | string[] | undefined, files: Express.Multer.File[], docType?: string | string[]) {
    const disbursement = await this.disbursementRepo.findOne({ where: { id: disbursementId } });
    if (!disbursement) throw new NotFoundException('Disbursement not found');

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh');
    await fs.ensureDir(uploadDir);

    const savedAttachments: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, file.buffer);

      // Determine individual title
      let itemTitle = '';
      if (Array.isArray(title)) {
        itemTitle = title[i] || `${title[0] || 'Chứng từ'} - ${file.originalname}`;
      } else {
        itemTitle = files.length > 1 ? `${title || 'Chứng từ'} - ${file.originalname}` : (title || file.originalname);
      }

      // Determine individual docType
      let itemDocType = '';
      if (Array.isArray(docType)) {
        itemDocType = docType[i] || docType[0] || '';
      } else {
        itemDocType = docType || '';
      }

      const attachment = this.attachmentRepo.create({
        disbursementId,
        title: itemTitle,
        path: `upload/asxh/${fileName}`, // Internal path
        docType: itemDocType,
      });

      const saved = await this.attachmentRepo.save(attachment);
      savedAttachments.push({
        id: saved.id,
        title: saved.title,
        file_url: `/api/v1/disbursement-attachments/${saved.id}/download`,
        uploaded_at: saved.uploaded_at,
        doc_type: saved.docType,
      });
    }

    return savedAttachments;
  }

  async deleteAttachment(disbursementId: number, attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId, disbursementId },
    });

    if (!attachment) throw new NotFoundException(`Attachment not found`);

    // Remove physical file
    const fullPath = path.join(process.cwd(), attachment.path);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
    }

    await this.attachmentRepo.remove(attachment);
    return { success: true };
  }

  async getAttachmentFile(attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException(`Attachment not found`);

    const fullPath = path.join(process.cwd(), attachment.path);
    if (!(await fs.pathExists(fullPath))) throw new NotFoundException(`File not found on disk`);

    return {
      path: fullPath,
      name: path.basename(attachment.path),
    };
  }

  async confirmSubmit(disbursementId: number, dto: ConfirmSubmitDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const disbursement = await manager.findOne(DisbursementEntity, {
        where: { id: disbursementId },
        relations: ['details', 'attachments'],
      });

      if (!disbursement) throw new NotFoundException(`Disbursement with ID ${disbursementId} not found`);

      // 1. Check status
      if (!['DRAFT', 'TRANSFERRED'].includes(disbursement.status as string)) {
        throw new BadRequestException(`Current status (${disbursement.status}) does not allow submission`);
      }

      // 2. Validate details
      if (!disbursement.details || disbursement.details.length === 0) {
        throw new BadRequestException('Disbursement must have at least one detail line');
      }

      const totalAmount = (disbursement.details || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const previousStatus = disbursement.status;

      // 4. Cập nhật trạng thái và bước duyệt
      // Step 1 đã tạo xong → Chuyển sang Step 2 (người duyệt PENDING_APPROVAL)
      disbursement.status = 'PENDING_APPROVAL';
      disbursement.current_step_order = 2;
      await manager.save(disbursement);

      // 5. Ghi log
      const log = manager.create(DisbursementLogEntity, {
        disbursementId,
        senderId: userId,
        action: 'confirm_submit',
        note: dto.note || 'Gửi phê duyệt thành công',
      });
      await manager.save(log);

      return {
        disbursement_id: disbursement.id,
        previous_status: previousStatus,
        current_status: disbursement.status,
        submitted_at: new Date().toISOString(),
      };
    });
  }

  async getNewContext(programId: number) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException(`Program with ID ${programId} not found`);

    const [kpi, items] = await Promise.all([
      this.calculateKPIs(programId),
      this.getProgramItemsWithBudget(programId),
    ]);

    return {
      program: {
        id: program.id,
        code: program.code,
        name: program.name,
        locality: program.locality,
        start_date: program.start_date,
        end_date: program.end_date,
      },
      kpi,
      items,
    };
  }

  private async getProgramItemsWithBudget(programId: number) {
    const items = await this.programItemRepo.find({ where: { program_id: programId } });

    return await Promise.all(items.map(async (item) => {
      const approvedBudget = Number(item.unit_price || 0) * Number(item.quantity || 0);

      const disbursedResult = await this.dataSource.createQueryBuilder()
        .select('SUM(dd.amount)', 'total')
        .from(DisbursementDetailEntity, 'dd')
        .innerJoin(DisbursementEntity, 'd', 'd.id = dd.disbursementId')
        .where('d.programItemId = :itemId', { itemId: item.id })
        .andWhere('d.status IN (:...statuses)', { statuses: ['TRANSFERRED', 'COMPLETED'] })
        .getRawOne();

      const disbursedAmount = parseFloat(disbursedResult?.total || 0);

      return {
        id: item.id,
        name: item.name,
        approved_budget: approvedBudget,
        disbursed_amount: disbursedAmount,
        remaining_amount: approvedBudget - disbursedAmount,
      };
    }));
  }

  async getNextCode(programId: number) {
    const program = await this.programRepo.findOne({ where: { id: programId } });
    if (!program) throw new NotFoundException('Program not found');

    const programNo = program.code.split('/').pop() || '000';
    const sequence = await this.sequenceRepo.findOne({ where: { programId } });
    const nextSeq = sequence ? sequence.nextSequenceNo : 1;

    return {
      program_no: programNo,
      sequence_no: nextSeq,
      code: `GN-${programNo}/${nextSeq.toString().padStart(2, '0')}`,
      display_round: `Đợt ${nextSeq}`,
    };
  }

  async searchReceivers(query: SearchReceiversQueryDto) {
    const { keyword, page, limit } = query;
    const qb = this.receiverRepo.createQueryBuilder('r').where('r.is_active = 1');

    if (keyword) {
      qb.andWhere('(r.name LIKE :keyword OR r.tax_code LIKE :keyword OR r.bank_account_number LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { items, total, page, limit };
  }

  async createReceiver(dto: CreateReceiverDto) {
    const receiver = this.receiverRepo.create(dto);
    return await this.receiverRepo.save(receiver);
  }

  async checkBudget(programItemId: number, dto: BudgetCheckDto) {
    const item = await this.programItemRepo.findOne({ where: { id: programItemId } });
    if (!item) throw new NotFoundException('Program item not found');

    const approvedBudget = Number(item.unit_price || 0) * Number(item.quantity || 0);
    const amountTotal = dto.details.reduce((sum, d) => sum + d.amount, 0);

    const disbursedResult = await this.dataSource.createQueryBuilder()
      .select('SUM(dd.amount)', 'total')
      .from(DisbursementDetailEntity, 'dd')
      .innerJoin(DisbursementEntity, 'd', 'd.id = dd.disbursementId')
      .where('d.programItemId = :itemId', { itemId: programItemId })
      .andWhere('d.status IN (:...statuses)', { statuses: ['TRANSFERRED', 'COMPLETED', 'PENDING_APPROVAL'] });

    if (dto.current_disbursement_id) {
      disbursedResult.andWhere('d.id != :currentId', { currentId: dto.current_disbursement_id });
    }

    const raw = await disbursedResult.getRawOne();
    const disbursedAmount = parseFloat(raw?.total || 0);

    const remainingBefore = approvedBudget - disbursedAmount;
    const remainingAfter = remainingBefore - amountTotal;

    return {
      amount_total: amountTotal,
      item_approved_budget: approvedBudget,
      item_disbursed_amount: disbursedAmount,
      item_remaining_before: remainingBefore,
      item_remaining_after: remainingAfter,
      is_over_budget: remainingAfter < 0,
      warning_message: remainingAfter < 0 ? `Số tiền vượt quá ngân sách còn lại (${remainingBefore.toLocaleString()}đ)` : null,
    };
  }

  async createDisbursement(programId: number, dto: CreateDisbursementDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const program = await manager.findOne(ProgramEntity, { where: { id: programId } });
      if (!program) throw new NotFoundException('Program not found');

      // 0. Validate Program Item
      const programItem = await manager.findOne(ProgramItemEntity, {
        where: { id: dto.program_item_id, program_id: programId },
      });
      if (!programItem) {
        throw new BadRequestException(`Hạng mục (ID: ${dto.program_item_id}) không thuộc chương trình (ID: ${programId}) hoặc không tồn tại.`);
      }

      // 1. Manage Sequence
      let sequence = await manager.findOne(ProgramDisbursementSequenceEntity, {
        where: { programId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sequence) {
        sequence = manager.create(ProgramDisbursementSequenceEntity, { programId, nextSequenceNo: 1 });
      }

      const currentSeq = sequence.nextSequenceNo;
      sequence.nextSequenceNo += 1;
      await manager.save(sequence);

      // --- NEW PERMISSION CHECK (Rigorous) ---
      if (dto.workflowKey) {
        const removeAccents = (str) => str?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') || "";
        const normalize = (str) => removeAccents(str?.toString().toUpperCase().replace(/_/g, "").replace(/\s/g, ""));
        const targetKey = normalize(dto.workflowKey);

        // 1. Lấy User
        const user = await this.userRepo.findOne({
          where: { id: userId }
        });

        const rolesByProcess = user?.rolesByProcess || [];

        // 2. Lấy cấu hình luồng
        const workflow = await this.workflowWizardService.getDetail(dto.workflowKey);
        if (workflow?.steps) {
          const step1 = workflow.steps.find(s => s.stepOrder === 1);
          const targetRole = normalize(step1?.roleCode);

          // 3. Kiểm tra quyền chi tiết trong rolesByProcess (Không dùng Fallback Admin theo yêu cầu)
          const userProcess = rolesByProcess.find(p => normalize(p.processKey) === targetKey || normalize(p.name) === targetKey);
          const hasDetailRole = userProcess?.roles?.some(r => normalize(r.roleCode) === targetRole);

          if (!hasDetailRole) {
            throw new BadRequestException(`Bạn không có quyền khởi tạo đợt giải ngân với luồng này (Yêu cầu vai trò: ${step1?.roleCode} cho quy trình ${dto.workflowKey}).`);
          }
        }
      }
      // ----------------------------

      // 2. Generate Code
      const programNo = program.code.split('/').pop() || '000';
      const code = `GN-${programNo}/${currentSeq.toString().padStart(2, '0')}`;

      // 3. Create Disbursement
      // 1.5 Handle Receiver
      let targetReceiverId = dto.receiver_id;
      let receivingUnit = dto.receiving_unit || '';

      if (targetReceiverId) {
        const receiverRecord = await manager.findOne(DisbursementReceiverEntity, { where: { id: targetReceiverId } });
        if (!receiverRecord) throw new NotFoundException('Receiver not found');
        receivingUnit = receiverRecord.name;
      } else if (receivingUnit) {
        // Auto-create receiver if not selected from list (handle manual entry)
        const newReceiver = manager.create(DisbursementReceiverEntity, {
          name: receivingUnit,
          tax_code: dto.tax_code,
          bank_name: dto.bank_name,
          bank_account_number: dto.bank_account_number,
          bank_branch: dto.bank_branch,
          bank_account_holder: dto.account_holder,
          is_active: true,
        });
        const savedReceiver = await manager.save(newReceiver);
        targetReceiverId = savedReceiver.id;
      } else {
        throw new BadRequestException('Vui lòng chọn hoặc nhập thông tin người nhận.');
      }

      // Handle Details (amount_details or details)
      const detailsArray = dto.amount_details || dto.details || [];
      if (detailsArray.length === 0) throw new BadRequestException('Cần ít nhất một khoản chi.');

      const dynamicWorkflowKey = await this.getASXHWorkflowKey();
      const isSubmit = dto.is_submit || dto.isSubmit;
      const targetWorkflowKey = dynamicWorkflowKey || dto.workflowKey || dto.workflow_key || 'GIAI_NGAN_ASXH';

      const disbursement = manager.create(DisbursementEntity, {
        programItemId: dto.program_item_id,
        disbursement_content: dto.disbursement_content || `Giải ngân đợt ${currentSeq}`,
        detailed_description: dto.detailed_description,
        expected_transfer_date: dto.expected_transfer_date ? new Date(dto.expected_transfer_date) : new Date(),
        receiver_id: targetReceiverId,
        receiving_unit: receivingUnit,
        notification_type: dto.notification_type,
        status: isSubmit ? 'PENDING_APPROVAL' : (dto.status || 'DRAFT'),
        current_step_order: isSubmit ? 2 : 1, // Step 2 nếu gửi duyệt ngay, Step 1 nếu lưu nháp
        code: code,
        workflowKey: targetWorkflowKey,
        sequence_no: currentSeq,
      });

      const savedDisbursement = await manager.save(disbursement);

      // 4. Create Details
      const details = detailsArray.map(d => manager.create(DisbursementDetailEntity, {
        disbursementId: savedDisbursement.id,
        expense_content: d.expense_content || '',
        amount: Number(d.amount),
      }));
      await manager.save(details);

      // 5. Log
      const log = manager.create(DisbursementLogEntity, {
        disbursementId: savedDisbursement.id,
        senderId: userId,
        action: isSubmit ? 'confirm_submit' : 'create_draft',
      });
      await manager.save(log);

      return {
        success: true,
        disbursement_id: savedDisbursement.id,
        code: code,
        sequence_no: currentSeq,
        status: savedDisbursement.status,
        amount_total: detailsArray.reduce((sum, d) => sum + Number(d.amount), 0),
      };
    });
  }

  async updateDisbursement(id: number, dto: UpdateDisbursementDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const disbursement = await manager.findOne(DisbursementEntity, {
        where: { id },
        relations: ['programItem'],
      });
      if (!disbursement) throw new NotFoundException('Disbursement not found');
      if (!['DRAFT', 'REJECTED'].includes(disbursement.status as any)) {
        throw new BadRequestException(`Chỉ có hồ sơ Nháp hoặc Bị từ chối mới được phép cập nhật. Trạng thái hiện tại: ${disbursement.status}`);
      }

      // Handle Receiver
      let targetReceiverId = dto.receiver_id;
      let receivingUnit = dto.receiving_unit || '';

      if (targetReceiverId) {
        const receiverRecord = await manager.findOne(DisbursementReceiverEntity, { where: { id: targetReceiverId } });
        if (!receiverRecord) throw new NotFoundException('Receiver not found');
        receivingUnit = receiverRecord.name;
      } else if (receivingUnit) {
        // Auto-create if manual entry
        const newReceiver = manager.create(DisbursementReceiverEntity, {
          name: receivingUnit,
          tax_code: dto.tax_code,
          bank_name: dto.bank_name,
          bank_account_number: dto.bank_account_number,
          bank_branch: dto.bank_branch,
          bank_account_holder: dto.account_holder,
          is_active: true,
        });
        const savedReceiver = await manager.save(newReceiver);
        targetReceiverId = savedReceiver.id;
      } else {
        throw new BadRequestException('Vui lòng chọn hoặc nhập thông tin người nhận.');
      }

      // Handle Details
      const detailsArray = dto.amount_details || dto.details || [];
      if (detailsArray.length === 0) throw new BadRequestException('Cần ít nhất một khoản chi.');

      // 0. Validate Program Item
      const programItem = await manager.findOne(ProgramItemEntity, {
        where: { id: dto.program_item_id, program_id: disbursement.programItem.program_id },
      });
      if (!programItem) {
        throw new BadRequestException(`Hạng mục (ID: ${dto.program_item_id}) không thuộc chương trình hiện tại hoặc không tồn tại.`);
      }

      const isSubmit = dto.is_submit || dto.isSubmit;
      disbursement.programItemId = dto.program_item_id;
      disbursement.disbursement_content = dto.disbursement_content;
      disbursement.detailed_description = dto.detailed_description;
      
      if (dto.expected_transfer_date) {
        disbursement.expected_transfer_date = new Date(dto.expected_transfer_date);
      }
      
      disbursement.receiver_id = targetReceiverId;
      disbursement.receiving_unit = receivingUnit;
      disbursement.notification_type = dto.notification_type;
      
      const newWorkflowKey = dto.workflowKey || dto.workflow_key;
      if (newWorkflowKey) disbursement.workflowKey = newWorkflowKey;
      
      if (isSubmit) {
        disbursement.status = 'PENDING_APPROVAL';
        disbursement.current_step_order = 2; // Chuyển sang Step 2 khi gửi duyệt
      } else if (dto.status) {
        disbursement.status = dto.status;
      }

      await manager.save(disbursement);

      // Update details: simple approach delete and recreate
      await manager.delete(DisbursementDetailEntity, { disbursementId: id });
      const details = detailsArray.map(d => manager.create(DisbursementDetailEntity, {
        disbursementId: id,
        expense_content: d.expense_content,
        amount: Number(d.amount),
      }));
      await manager.save(details);

      // Log
      const log = manager.create(DisbursementLogEntity, {
        disbursementId: id,
        senderId: userId,
        action: isSubmit ? 'confirm_submit' : 'update_draft',
      });
      await manager.save(log);

      return {
        success: true,
        amount_total: detailsArray.reduce((sum, d) => sum + Number(d.amount), 0),
        status: disbursement.status,
      };
    });
  }

  /**
   * Bảng ánh xạ nghiêm ngặt: Step → Status hiện tại hợp lệ → Status tiếp theo
   * Step 2: PENDING_APPROVAL → APPROVED
   * Step 3: APPROVED → DISBURSED
   * Step 4: DISBURSED → COMPLETED
   * Mọi step đều có thể REJECT → về DRAFT, current_step_order quay về 1
   */
  private readonly STEP_STATUS_MAP: Record<number, { validCurrentStatuses: string[]; nextStatus: string }> = {
    2: { validCurrentStatuses: ['PENDING_APPROVAL'], nextStatus: 'APPROVED' },
    3: { validCurrentStatuses: ['APPROVED'], nextStatus: 'DISBURSED' },
    4: { validCurrentStatuses: ['DISBURSED'], nextStatus: 'COMPLETED' },
  };

  /**
   * Derive the correct step order from the current status.
   * This fixes legacy data where current_step_order doesn't match status.
   * Status is the source of truth.
   */
  private deriveStepFromStatus(status: string, dbStepOrder: number): number {
    const STATUS_TO_STEP: Record<string, number> = {
      'DRAFT': 1,
      'REJECTED': 1,
      'PENDING_APPROVAL': 2,
      'APPROVED': 3,
      'DISBURSED': 4,
      'COMPLETED': 5,
    };
    const normalizedStatus = (status || 'DRAFT').toString().trim().toUpperCase();
    const expectedStep = STATUS_TO_STEP[normalizedStatus];
    if (expectedStep && expectedStep !== dbStepOrder) {
      console.log(`[ASXH] Correcting step: DB=${dbStepOrder}, Status=${normalizedStatus}, Derived=${expectedStep}`);
      return expectedStep;
    }
    return dbStepOrder;
  }

  async updateStatus(id: number, dto: UpdateDisbursementStatusDto, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const disbursement = await manager.findOne(DisbursementEntity, { where: { id } });
      if (!disbursement) throw new NotFoundException('Disbursement not found');

      const oldStatus = (disbursement.status || "DRAFT").toString().trim().toUpperCase();
      const newStatus = dto.status.toUpperCase();
      const workflowKey = disbursement.workflowKey;

      if (!workflowKey) {
        disbursement.status = dto.status;
        return await manager.save(disbursement);
      }

      // 1. Derive correct step from status (fixes legacy data with wrong step)
      const dbStepNum = disbursement.current_step_order || 1;
      const currentStepNum = this.deriveStepFromStatus(oldStatus, dbStepNum);

      // Auto-fix DB if step was wrong
      if (currentStepNum !== dbStepNum) {
        disbursement.current_step_order = currentStepNum;
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      const workflow = await this.workflowWizardService.getDetail(workflowKey);

      if (!workflow || !workflow.steps) throw new InternalServerErrorException('Cấu hình luồng không tồn tại');

      const currentStepConfig = workflow.steps.find(s => s.stepOrder === currentStepNum);
      if (!currentStepConfig) throw new BadRequestException(`Không tìm thấy cấu hình Step ${currentStepNum} trong luồng ${workflowKey}`);

      // DEBUG LOG
      console.log("ASXH UPDATE STATUS DEBUG:", {
        id, oldStatus, newStatus, currentStep: currentStepNum,
        requiredRole: currentStepConfig.roleCode,
        userRoles: user?.rolesByProcess?.find(p => p.processKey === workflowKey || p.name === workflowKey)?.roles?.map(r => r.roleCode)
      });

      const rolesByProcess = user?.rolesByProcess || [];
      const removeAccents = (str) => str?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') || "";
      const normalize = (str) => removeAccents(str?.toString().toUpperCase().replace(/_/g, "").replace(/\s/g, ""));
      const targetRole = normalize(currentStepConfig?.roleCode);
      const targetKey = normalize(workflowKey);

      // 2. Check Detailed Roles (Strict)
      const userProcess = rolesByProcess.find(p => normalize(p.processKey) === targetKey || normalize(p.name) === targetKey);
      const hasDetailRole = userProcess?.roles?.some(r => normalize(r.roleCode) === targetRole || normalize(r?.['roleName'] || r?.['name']) === targetRole);

      if (!hasDetailRole) {
        throw new BadRequestException(`Bạn không có quyền thực hiện bước này (Yêu cầu vai trò: ${currentStepConfig?.roleCode} tại Step ${currentStepNum} cho quy trình ${workflowKey})`);
      }

      // 3. STRICT: Validate status transition based on step
      if (newStatus === 'REJECTED') {
        // Reject is allowed from any approval step (2, 3, 4)
        if (currentStepNum < 2) {
          throw new BadRequestException('Không thể từ chối ở bước khởi tạo (Step 1).');
        }
        disbursement.status = 'REJECTED';
        disbursement.current_step_order = 1; // Reset to step 1 for step-1 user to edit
      } else {
        // Approve: enforce strict step→status mapping
        const stepConfig = this.STEP_STATUS_MAP[currentStepNum];
        if (!stepConfig) {
          throw new BadRequestException(`Step ${currentStepNum} không có cấu hình chuyển trạng thái hợp lệ.`);
        }

        if (!stepConfig.validCurrentStatuses.includes(oldStatus)) {
          throw new BadRequestException(
            `Trạng thái hiện tại "${oldStatus}" không hợp lệ cho Step ${currentStepNum}. ` +
            `Yêu cầu trạng thái: ${stepConfig.validCurrentStatuses.join(', ')}.`
          );
        }

        disbursement.status = stepConfig.nextStatus;
        disbursement.current_step_order = currentStepNum + 1; // Advance to next step
      }

      await manager.save(disbursement);

      // Log the status change
      const log = manager.create(DisbursementLogEntity, {
        disbursementId: id,
        senderId: userId,
        action: 'update_status',
        note: dto.note || `Trạng thái thay đổi từ ${oldStatus} thành ${disbursement.status}`,
      });
      await manager.save(log);

      return {
        success: true,
        disbursement_id: id,
        old_status: oldStatus,
        new_status: disbursement.status,
        current_step_order: disbursement.current_step_order,
      };
    });
  }

  async classifyAttachment(attachmentId: number, docType: string) {
    const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Attachment not found');

    attachment.docType = docType;
    await this.attachmentRepo.save(attachment);
    return { success: true };
  }

  async saveDraft(id: number, userId: string) {
    const disbursement = await this.disbursementRepo.findOne({ where: { id } });
    if (!disbursement) throw new NotFoundException('Disbursement not found');

    // Ensure status is DRAFT if transitioning from something else (if business rules allow)
    // For now, just logging the "Save" action.
    const log = this.dataSource.getRepository(DisbursementLogEntity).create({
      disbursementId: id,
      senderId: userId,
      action: 'save_draft',
    });
    await this.dataSource.getRepository(DisbursementLogEntity).save(log);

    return { success: true };
  }
  async exportDisbursements(programId: number, query: DisbursementOverviewQueryDto) {
    const { keyword, status, sort } = query;

    const qb = this.disbursementRepo.createQueryBuilder('d')
      .innerJoin(ProgramItemEntity, 'pi', 'pi.id = d.programItemId')
      .where('pi.program_id = :programId', { programId });

    if (keyword) {
      qb.andWhere('(d.disbursement_content LIKE :keyword OR d.receiving_unit LIKE :keyword)', { keyword: `%${keyword}%` });
    }

    if (status) {
      qb.andWhere('d.status = :status', { status });
    }

    if (sort === 'expected_transfer_date_asc') {
      qb.orderBy('d.expected_transfer_date', 'ASC');
    } else {
      qb.orderBy('d.expected_transfer_date', 'DESC');
    }

    const items = await qb.getMany();

    const itemsWithTotals = await Promise.all(items.map(async (item) => {
      const amountResult = await this.dataSource.getRepository(DisbursementDetailEntity)
        .createQueryBuilder('dd')
        .select('SUM(dd.amount)', 'total')
        .where('dd.disbursement_id = :id', { id: item.id })
        .getRawOne();

      return {
        ...item,
        amount_total: parseFloat(amountResult?.total || 0),
      };
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách giải ngân');

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 10 },
      { header: 'Mã đợt', key: 'code', width: 20 },
      { header: 'Nội dung giải ngân', key: 'content', width: 40 },
      { header: 'Ngày dự kiến', key: 'expected_date', width: 20 },
      { header: 'Đơn vị thụ hưởng', key: 'receiver', width: 30 },
      { header: 'Tổng tiền (VNĐ)', key: 'amount', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const statusesMap = {
      'COMPLETED': 'Hoàn thành',
      'TRANSFERRED': 'Đã chuyển tiền',
      'PENDING_APPROVAL': 'Chờ duyệt',
      'DRAFT': 'Nháp',
    };

    itemsWithTotals.forEach((item, index) => {
      worksheet.addRow({
        stt: index + 1,
        code: item.code,
        content: item.disbursement_content,
        expected_date: item.expected_transfer_date ? new Date(item.expected_transfer_date).toLocaleDateString('vi-VN') : '',
        receiver: item.receiving_unit,
        amount: item.amount_total,
        status: statusesMap[item.status as keyof typeof statusesMap] || item.status,
      });
    });

    worksheet.getColumn('amount').numFmt = '#,##0';

    return await workbook.xlsx.writeBuffer();
  }

  async deleteDisbursement(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      const disbursement = await manager.findOne(DisbursementEntity, {
        where: { id },
        relations: ['attachments'],
      });

      if (!disbursement) throw new NotFoundException('Disbursement not found');
      if (!['DRAFT', 'REJECTED'].includes(disbursement.status || '')) {
        throw new BadRequestException(`Chỉ có thể xóa đợt giải ngân ở trạng thái Nháp (DRAFT) hoặc Từ chối (REJECTED). Trạng thái hiện tại: ${disbursement.status}`);
      }

      // 1. Delete Details
      await manager.delete(DisbursementDetailEntity, { disbursementId: id });

      // 2. Delete Logs
      await manager.delete(DisbursementLogEntity, { disbursementId: id });

      // 3. Handle Attachments (Physical files + DB records)
      if (disbursement.attachments && disbursement.attachments.length > 0) {
        for (const attachment of disbursement.attachments) {
          const fullPath = path.join(process.cwd(), attachment.path);
          if (await fs.pathExists(fullPath)) {
            await fs.remove(fullPath);
          }
        }
        await manager.delete(DisbursementAttachmentEntity, { disbursementId: id });
      }

      // 4. Delete the main entity
      await manager.delete(DisbursementEntity, { id });

      return { success: true, message: `Đã xóa thành công đợt giải ngân ID ${id}` };
    });
  }
}

