import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In, Like, Not } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ExcelJS from 'exceljs';
import { UniversityPartnerEntity } from '../entities/university-partner.entity';
import { UniversityPartnerQuotaEntity } from '../entities/university-partner-quota.entity';
import { UniversityPartnerContactEntity } from '../entities/university-partner-contact.entity';
import { UniversityPartnerAttachmentEntity } from '../entities/university-partner-attachment.entity';
import { ScholarshipCandidateEntity } from '../entities/scholarship-candidate.entity';
import { ScholarshipCandidateResultEntity } from '../entities/scholarship-candidate-result.entity';
import { ScholarshipCandidateAttachmentEntity } from '../entities/scholarship-candidate-attachment.entity';
import { ScholarshipCandidateSequenceEntity } from '../entities/scholarship-candidate-sequence.entity';
import {
  CreateUniversityPartnerDto,
  UpdateUniversityPartnerDto,
  UniversityPartnerListingQueryDto,
  CreateScholarshipCandidateDto,
  UpdateScholarshipCandidateDto,
  ScholarshipCandidateListingQueryDto,
  CandidateStatusUpdateDto,
  EducationScholarshipOverviewDto,
} from '../dto/education-scholarship.dto';

@Injectable()
export class EducationScholarshipService {
  private readonly logger = new Logger(EducationScholarshipService.name);

  constructor(
    @InjectRepository(UniversityPartnerEntity, 'mssqlConnection')
    private readonly partnerRepo: Repository<UniversityPartnerEntity>,
    @InjectRepository(UniversityPartnerQuotaEntity, 'mssqlConnection')
    private readonly quotaRepo: Repository<UniversityPartnerQuotaEntity>,
    @InjectRepository(UniversityPartnerContactEntity, 'mssqlConnection')
    private readonly contactRepo: Repository<UniversityPartnerContactEntity>,
    @InjectRepository(UniversityPartnerAttachmentEntity, 'mssqlConnection')
    private readonly partnerAttachRepo: Repository<UniversityPartnerAttachmentEntity>,
    @InjectRepository(ScholarshipCandidateEntity, 'mssqlConnection')
    private readonly candidateRepo: Repository<ScholarshipCandidateEntity>,
    @InjectRepository(ScholarshipCandidateResultEntity, 'mssqlConnection')
    private readonly resultRepo: Repository<ScholarshipCandidateResultEntity>,
    @InjectRepository(ScholarshipCandidateAttachmentEntity, 'mssqlConnection')
    private readonly candidateAttachRepo: Repository<ScholarshipCandidateAttachmentEntity>,
    @InjectRepository(ScholarshipCandidateSequenceEntity, 'mssqlConnection')
    private readonly sequenceRepo: Repository<ScholarshipCandidateSequenceEntity>,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
  ) {}

  async getOverview(schoolYear?: string): Promise<EducationScholarshipOverviewDto> {
    const startYear = schoolYear ? String(schoolYear).substring(0, 4) : null;

    const [
      total_partners,
      total_candidates,
      candidate_stats,
      quota_sum,
      budget_sum,
      disbursed_sum,
      partner_stats_raw,
    ] = await Promise.all([
      // Count partners (Inclusion logic)
      startYear 
        ? this.partnerRepo.createQueryBuilder('p')
            .where(`
              (LEN(p.school_year) >= 9 AND CAST(SUBSTRING(p.school_year, 1, 4) AS INT) <= :yStart AND CAST(SUBSTRING(p.school_year, 6, 4) AS INT) >= :yEnd)
              OR
              (LEN(p.school_year) = 4 AND CAST(p.school_year AS INT) = :yStart)
            `, { yStart: parseInt(startYear), yEnd: parseInt(startYear) + 1 })
            .getCount()
        : this.partnerRepo.count(),

      // Count candidates (Exact match logic)
      startYear
        ? this.candidateRepo.count({ where: { school_year: Like(`${startYear}%`) } })
        : this.candidateRepo.count(),

      // Candidate status stats (Exact match logic)
      (() => {
        const qb = this.candidateRepo.createQueryBuilder('c')
          .select('c.status', 'status')
          .addSelect('COUNT(c.id)', 'count')
          .groupBy('c.status');
        if (startYear) qb.andWhere('c.school_year LIKE :startYear', { startYear: `${startYear}%` });
        return qb.getRawMany();
      })(),

      // Quota slots (Inclusion logic)
      (() => {
        const qb = this.quotaRepo.createQueryBuilder('q')
          .select('SUM(q.slots)', 'total_slots');
        if (startYear) {
          qb.innerJoin(UniversityPartnerEntity, 'p', 'p.id = q.university_partner_id')
            .andWhere(`
              (LEN(p.school_year) >= 9 AND CAST(SUBSTRING(p.school_year, 1, 4) AS INT) <= :yStart AND CAST(SUBSTRING(p.school_year, 6, 4) AS INT) >= :yEnd)
              OR
              (LEN(p.school_year) = 4 AND CAST(p.school_year AS INT) = :yStart)
            `, { yStart: parseInt(startYear), yEnd: parseInt(startYear) + 1 });
        }
        return qb.getRawOne();
      })(),

      // Budget sum (Inclusion logic)
      (() => {
        const qb = this.quotaRepo.createQueryBuilder('q')
          .select('SUM(CAST(q.slots AS DECIMAL) * q.amount_per_slot)', 'total_budget');
        if (startYear) {
          qb.innerJoin(UniversityPartnerEntity, 'p', 'p.id = q.university_partner_id')
            .andWhere(`
              (LEN(p.school_year) >= 9 AND CAST(SUBSTRING(p.school_year, 1, 4) AS INT) <= :yStart AND CAST(SUBSTRING(p.school_year, 6, 4) AS INT) >= :yEnd)
              OR
              (LEN(p.school_year) = 4 AND CAST(p.school_year AS INT) = :yStart)
            `, { yStart: parseInt(startYear), yEnd: parseInt(startYear) + 1 });
        }
        return qb.getRawOne();
      })(),

      // Disbursed budget (Exact match logic)
      (() => {
        const qb = this.candidateRepo
          .createQueryBuilder('c')
          .select('SUM(q.amount_per_slot)', 'disbursed_budget')
          .innerJoin(UniversityPartnerQuotaEntity, 'q', 'q.university_partner_id = c.university_partner_id AND q.major_name = c.major_name')
          .where('c.status = :status', { status: 'DISBURSED' });
        if (startYear) qb.andWhere('c.school_year LIKE :startYear', { startYear: `${startYear}%` });
        return qb.getRawOne();
      })(),

      // Partner stats (Inclusion logic)
      (() => {
        const qb = this.partnerRepo
          .createQueryBuilder('p')
          .leftJoin(ScholarshipCandidateEntity, 'c', 'c.university_partner_id = p.id')
          .select('p.name', 'name')
          .addSelect('COUNT(c.id)', 'candidate_count')
          .addSelect('SUM(CASE WHEN c.status IN (\'APPROVED\', \'DISBURSED\') THEN 1 ELSE 0 END)', 'approved_count')
          .groupBy('p.name')
          .orderBy('candidate_count', 'DESC')
          .limit(10);
        if (startYear) {
          qb.andWhere(`
            (LEN(p.school_year) >= 9 AND CAST(SUBSTRING(p.school_year, 1, 4) AS INT) <= :yStart AND CAST(SUBSTRING(p.school_year, 6, 4) AS INT) >= :yEnd)
            OR
            (LEN(p.school_year) = 4 AND CAST(p.school_year AS INT) = :yStart)
          `, { yStart: parseInt(startYear), yEnd: parseInt(startYear) + 1 });
        }
        return qb.getRawMany();
      })(),
    ]);

    return {
      total_partners,
      total_candidates,
      total_approved_candidates: candidate_stats.filter(s => ['APPROVED', 'DISBURSED'].includes(s.status)).reduce((acc, curr) => acc + parseInt(curr.count), 0),
      total_disbursed_candidates: parseInt(candidate_stats.find(s => s.status === 'DISBURSED')?.count || '0'),
      total_slots: parseInt(quota_sum?.total_slots || '0'),
      total_budget: parseFloat(budget_sum?.total_budget || '0'),
      disbursed_budget: parseFloat(disbursed_sum?.disbursed_budget || '0'),
      candidate_status_stats: candidate_stats.map(s => ({
        status: s.status,
        count: parseInt(s.count),
      })),
      partner_stats: partner_stats_raw.map(p => ({
        name: p.name,
        candidate_count: parseInt(p.candidate_count),
        approved_count: parseInt(p.approved_count),
      })),
    };
  }

  private calculateSchoolYear(signDate: any, expiryDate: any): string | null {
    if (!signDate && !expiryDate) return null;
    try {
      const extractYear = (val: any): number | null => {
        if (!val) return null;
        if (typeof val === 'string' && /^\d{4}/.test(val)) {
          return parseInt(val.substring(0, 4), 10);
        }
        const date = new Date(val);
        const year = date.getFullYear();
        return isNaN(year) ? null : year;
      };

      const startYear = extractYear(signDate);
      const endYear = extractYear(expiryDate);

      if (startYear && endYear) {
        if (startYear === endYear) return `${startYear}`;
        return `${startYear}-${endYear}`;
      }
      if (startYear) return `${startYear}-${startYear + 1}`;
      if (endYear) return `${endYear - 1}-${endYear}`;
    } catch (e) {
      this.logger.error('Error calculating school year', e);
    }
    return null;
  }

  // --- UNIVERSITY PARTNERS ---

  async findPartners(query: UniversityPartnerListingQueryDto) {
    const { keyword, school_year, status, page, limit } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const qb = this.partnerRepo.createQueryBuilder('p');

    if (keyword) {
      qb.andWhere('(p.name LIKE :kw OR p.short_name LIKE :kw OR p.code LIKE :kw)', { kw: `%${keyword}%` });
    }

    if (school_year) {
      const startYearVal = String(school_year).substring(0, 4);
      qb.andWhere(`
        (LEN(p.school_year) >= 9 AND CAST(SUBSTRING(p.school_year, 1, 4) AS INT) <= :yStart AND CAST(SUBSTRING(p.school_year, 6, 4) AS INT) >= :yEnd)
        OR
        (LEN(p.school_year) = 4 AND CAST(p.school_year AS INT) = :yStart)
      `, { yStart: parseInt(startYearVal), yEnd: parseInt(startYearVal) + 1 });
    }

    if (status) {
      qb.andWhere('p.cooperation_status = :status', { status });
    }

    qb.addSelect(subQuery => {
      const sq = subQuery
        .select('SUM(q.slots)', 'total_slots')
        .from(UniversityPartnerQuotaEntity, 'q')
        .where('q.university_partner_id = p.id');
      return sq;
    }, 'slots');

    qb.addSelect(subQuery => {
      const sq = subQuery
        .select('SUM(CAST(q.slots AS DECIMAL) * q.amount_per_slot)', 'total_budget')
        .from(UniversityPartnerQuotaEntity, 'q')
        .where('q.university_partner_id = p.id');
      return sq;
    }, 'budget');

    qb.addSelect(subQuery => {
      const sq = subQuery
        .select('COUNT(c.id)', 'pending_count')
        .from(ScholarshipCandidateEntity, 'c')
        .where('c.university_partner_id = p.id AND c.status = :pending_status', { pending_status: 'SUBMITTED' });
      
      if (school_year) {
        const startYear = String(school_year).substring(0, 4);
        sq.andWhere('c.school_year LIKE :startYear', { startYear: `${startYear}%` });
      }
      return sq;
    }, 'pending');

    qb.orderBy('p.created_at', 'DESC');

    const total = await qb.getCount();
    const rawResults = await qb.offset(skip).limit(limitNum).getRawMany();

    const items = rawResults.map(raw => {
      const item: any = {};
      for (const key in raw) {
        if (key.startsWith('p_')) {
          item[key.replace('p_', '')] = raw[key];
        }
      }
      return {
        ...item,
        slots: parseInt(raw.slots || '0'),
        budget: parseFloat(raw.budget || '0'),
        pending: parseInt(raw.pending || '0'),
      };
    });

    return { items, total, page: pageNum, limit: limitNum };
  }

  async findPartnerById(id: number) {
    const partner = await this.partnerRepo.findOne({
      where: { id },
    });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    const [quotas, contacts, attachments] = await Promise.all([
      this.quotaRepo.find({ where: { university_partner_id: id } }),
      this.contactRepo.find({ where: { university_partner_id: id } }),
      this.partnerAttachRepo.find({ where: { university_partner_id: id } }),
    ]);

    return {
      ...partner,
      quotas,
      contacts,
      attachments,
    };
  }

  async createPartner(dto: CreateUniversityPartnerDto, userId?: number) {
    const status = dto.cooperation_status || dto.status || 'DRAFT';
    let partnerCode = dto.code;

    // Nếu là bản nháp và chưa có mã, tạo mã tạm thời để tránh lỗi trùng lặp NULL trong DB
    if (status === 'DRAFT' && !partnerCode) {
      partnerCode = `DRAFT-P-${Date.now()}`;
    } else if (!partnerCode) {
      throw new BadRequestException('Mã đối tác là bắt buộc');
    }

    if (dto.code) {
      const existing = await this.partnerRepo.findOne({ where: { code: dto.code } });
      if (existing) throw new BadRequestException(`Mã đối tác '${dto.code}' đã tồn tại`);
    }

    const signDate = dto.sign_date || dto.expected_sign_date;
    const expiryDate = dto.expiry_date || dto.effective_date;
    const computedYear = dto.school_year || this.calculateSchoolYear(signDate, expiryDate);

    return await this.dataSource.transaction(async (manager) => {
      const partner = manager.create(UniversityPartnerEntity, {
        ...dto,
        name: dto.name || '',
        code: partnerCode,
        primary_field: dto.main_field || dto.primary_field,
        cooperation_status: status,
        expected_sign_date: signDate || null,
        effective_date: expiryDate || null,
        tcsg_signer_name: dto.signatory_tcsg || dto.tcsg_signer_name,
        school_signer_name: dto.signatory_school || dto.school_signer_name,
        cooperation_goal: dto.cooperation_goals || dto.cooperation_goal,
        priority_target: dto.priority_group || dto.priority_target,
        school_year: computedYear,
        cooperation_contents: Array.isArray(dto.cooperation_contents) ? dto.cooperation_contents.join(',') : dto.cooperation_contents,
        created_by: userId,
        updated_by: userId,
      } as any);

      const savedPartner = await manager.save(partner);

      if (dto.quotas && dto.quotas.length > 0) {
        const quotas = dto.quotas.map(q => manager.create(UniversityPartnerQuotaEntity, {
          ...q,
          university_partner_id: savedPartner.id,
          created_by: userId,
        }));
        await manager.save(quotas);
      }

      if (dto.contacts && dto.contacts.length > 0) {
        const contacts = dto.contacts.map(c => manager.create(UniversityPartnerContactEntity, {
          ...c,
          full_name: c.full_name || c.name,
          title: c.title || c.position,
          university_partner_id: savedPartner.id,
          created_by: userId,
        }));
        await manager.save(contacts);
      }

      return savedPartner;
    });
  }

  async updatePartner(id: number, dto: UpdateUniversityPartnerDto, userId?: number) {
    if (dto.code) {
      const existing = await this.partnerRepo.findOne({ where: { code: dto.code, id: Not(id) } });
      if (existing) throw new BadRequestException(`Mã đối tác '${dto.code}' đã tồn tại`);
    }

    const signDate = dto.sign_date || dto.expected_sign_date;
    const expiryDate = dto.expiry_date || dto.effective_date;

    return await this.dataSource.transaction(async (manager) => {
      const partner = await manager.findOne(UniversityPartnerEntity, { where: { id } });
      if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

      const computedYear = dto.school_year || this.calculateSchoolYear(signDate, expiryDate) || partner.school_year;

      manager.merge(UniversityPartnerEntity, partner, {
        ...dto,
        primary_field: dto.main_field || dto.primary_field,
        cooperation_status: dto.status || dto.cooperation_status,
        expected_sign_date: signDate || partner.expected_sign_date,
        effective_date: expiryDate || partner.effective_date,
        tcsg_signer_name: dto.signatory_tcsg || dto.tcsg_signer_name,
        school_signer_name: dto.signatory_school || dto.school_signer_name,
        cooperation_goal: dto.cooperation_goals || dto.cooperation_goal,
        priority_target: dto.priority_group || dto.priority_target,
        school_year: computedYear,
        cooperation_contents: Array.isArray(dto.cooperation_contents) ? dto.cooperation_contents.join(',') : (dto.cooperation_contents !== undefined ? dto.cooperation_contents : partner.cooperation_contents),
        updated_by: userId,
        updated_at: new Date(),
      } as any);

      await manager.save(partner);

      // Simple sync for quotas and contacts (delete and recreate)
      if (dto.quotas) {
        await manager.delete(UniversityPartnerQuotaEntity, { university_partner_id: id });
        if (dto.quotas.length > 0) {
          const quotas = dto.quotas.map(q => manager.create(UniversityPartnerQuotaEntity, {
            ...q,
            university_partner_id: id,
            created_by: userId,
          }));
          await manager.save(quotas);
        }
      }

      if (dto.contacts) {
        await manager.delete(UniversityPartnerContactEntity, { university_partner_id: id });
        if (dto.contacts.length > 0) {
          const contacts = dto.contacts.map(c => manager.create(UniversityPartnerContactEntity, {
            ...c,
            full_name: c.full_name || c.name,
            title: c.title || c.position,
            university_partner_id: id,
            created_by: userId,
          }));
          await manager.save(contacts);
        }
      }

      return { success: true };
    });
  }

  async togglePartnerStatus(id: number, userId?: number) {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    // Toggle logic:
    // Nếu đang PAUSED hoặc INACTIVE -> Chuyển sang NEGOTIATING (Đang thương lượng)
    // Nếu đang bất kỳ trạng thái nào khác (ACTIVE, PENDING, NEGOTIATING...) -> Chuyển sang PAUSED
    if (partner.cooperation_status === 'PAUSED' || partner.cooperation_status === 'INACTIVE') {
      partner.cooperation_status = 'NEGOTIATING';
    } else {
      partner.cooperation_status = 'PAUSED';
    }

    if (userId) partner.updated_by = userId;
    partner.updated_at = new Date();

    await this.partnerRepo.save(partner);
    return {
      success: true,
      status: partner.cooperation_status,
      message: partner.cooperation_status === 'NEGOTIATING' ? 'Đã chuyển trạng thái sang Đang thương lượng' : 'Đã tạm dừng hợp tác với đối tác'
    };
  }

  async deletePartner(id: number) {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    // Thu thập danh sách file cần xóa (optional but good practice for permanent delete)
    const filesToDelete: string[] = [];
    if (partner.logo_path) filesToDelete.push(partner.logo_path);

    // Xóa vĩnh viễn dữ liệu liên quan
    await this.dataSource.transaction(async manager => {
      // 1. Tìm và xử lý ứng viên
      const candidates = await manager.find(ScholarshipCandidateEntity, { where: { university_partner_id: id } });
      const candidateIds = candidates.map(c => c.id);

      if (candidateIds.length > 0) {
        // Xóa kết quả và đính kèm của ứng viên
        await manager.delete(ScholarshipCandidateResultEntity, { scholarship_candidate_id: In(candidateIds) });
        await manager.delete(ScholarshipCandidateAttachmentEntity, { scholarship_candidate_id: In(candidateIds) });
        // Xóa ứng viên
        await manager.delete(ScholarshipCandidateEntity, { id: In(candidateIds) });
      }

      // 2. Xóa Quota, Liên hệ, Tài liệu đính kèm của đối tác
      await manager.delete(UniversityPartnerQuotaEntity, { university_partner_id: id });
      await manager.delete(UniversityPartnerContactEntity, { university_partner_id: id });
      await manager.delete(UniversityPartnerAttachmentEntity, { university_partner_id: id });

      // 3. Xóa chính đối tác
      await manager.delete(UniversityPartnerEntity, { id });
    });

    // Xóa file vật lý (không throw lỗi nếu file không tồn tại)
    for (const filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        if (await fs.pathExists(fullPath)) await fs.remove(fullPath);
      } catch (e) {
        this.logger.error(`Failed to delete file ${filePath}: ${e.message}`);
      }
    }

    return { success: true, message: 'Đã xóa vĩnh viễn đối tác và toàn bộ dữ liệu liên quan' };
  }

  async uploadPartnerLogo(id: number, file: Express.Multer.File) {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh', 'partners', 'logos');
    await fs.ensureDir(uploadDir);

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    partner.logo_path = `upload/asxh/partners/logos/${fileName}`;
    await this.partnerRepo.save(partner);

    return { path: partner.logo_path };
  }

  async uploadPartnerAttachment(id: number, title: string, docType: string, file: Express.Multer.File, userId?: number) {
    const partner = await this.partnerRepo.findOne({ where: { id } });
    if (!partner) throw new NotFoundException('Không tìm thấy đối tác');

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh', 'partners', 'attachments');
    await fs.ensureDir(uploadDir);

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    const attachment = this.partnerAttachRepo.create({
      university_partner_id: id,
      title,
      doc_type: docType,
      path: `upload/asxh/partners/attachments/${fileName}`,
      uploaded_by: userId,
    });

    return await this.partnerAttachRepo.save(attachment);
  }

  async deletePartnerAttachment(attachmentId: number) {
    const attachment = await this.partnerAttachRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Không tìm thấy tài liệu');

    const fullPath = path.join(process.cwd(), attachment.path);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
    }

    await this.partnerAttachRepo.remove(attachment);
    return { success: true };
  }

  // --- SCHOLARSHIP CANDIDATES ---

  async findCandidates(query: ScholarshipCandidateListingQueryDto) {
    const { keyword, university_partner_id, status, school_year, page, limit } = query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const qb = this.candidateRepo.createQueryBuilder('c')
      .leftJoinAndSelect(UniversityPartnerEntity, 'p', 'p.id = c.university_partner_id');

    if (keyword) {
      qb.andWhere('(c.full_name LIKE :kw OR c.code LIKE :kw OR c.student_code LIKE :kw)', { kw: `%${keyword}%` });
    }

    if (university_partner_id) {
      qb.andWhere('c.university_partner_id = :partner_id', { partner_id: university_partner_id });
    }

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }

    if (school_year) {
      const sYear = String(school_year).substring(0, 4);
      qb.andWhere('c.school_year LIKE :startYear', { startYear: `${sYear}%` });
    }
    qb.orderBy('c.created_at', 'DESC');

    const [items, total] = await qb.skip(skip).take(limitNum).getManyAndCount();

    const partnerIds = [...new Set(items.map(i => i.university_partner_id).filter(Boolean))];
    const partners = partnerIds.length > 0 ? await this.partnerRepo.findBy({ id: In(partnerIds) }) : [];
    const partnerMap = new Map(partners.map(p => [p.id, p.name]));

    return {
      items: items.map(c => ({
        ...c,
        university_name: partnerMap.get(c.university_partner_id) || c.university_name,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async previewCandidateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.sequenceRepo.findOne({ where: { year } });
    const nextNo = sequence ? sequence.next_candidate_no : 1;
    return `HB-${year}/${nextNo.toString().padStart(4, '0')}`;
  }

  async createCandidate(dto: CreateScholarshipCandidateDto, userId?: number) {
    const nationalId = dto.national_id || dto.identity_number;

    return await this.dataSource.transaction(async (manager) => {
      // 1. Generate Code
      const year = new Date().getFullYear();
      let sequence = await manager.findOne(ScholarshipCandidateSequenceEntity, {
        where: { year },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sequence) {
        sequence = manager.create(ScholarshipCandidateSequenceEntity, { year, next_candidate_no: 1 });
      }

      const currentSeq = sequence.next_candidate_no;
      sequence.next_candidate_no += 1;
      await manager.save(sequence);

      const code = `HB-${year}/${currentSeq.toString().padStart(4, '0')}`;

      // 2. Create Candidate
      const currYear = new Date().getFullYear();
      const defaultSchoolYear = `${currYear}-${currYear + 1}`;

      const candidate = manager.create(ScholarshipCandidateEntity, {
        ...dto,
        full_name: dto.full_name || '',
        dob: (dto.dob || dto.birth_date || null) as any,
        national_id: dto.national_id || dto.identity_number,
        permanent_address: dto.permanent_address || dto.address,
        study_year: dto.study_year || (dto.school_year?.startsWith('Năm') ? dto.school_year : undefined),
        school_year: dto.school_year?.includes('-') ? dto.school_year : defaultSchoolYear,
        gpa_current: dto.gpa_current || dto.gpa,
        family_context: dto.family_context || dto.family_description,
        income_per_person_per_month: dto.income_per_person_per_month || dto.income_per_capita,
        siblings_in_school_count: dto.siblings_in_school_count || dto.studying_siblings,
        motivation_letter: dto.motivation_letter || dto.essay_content,
        skills_certificates: dto.skills_certificates || dto.skills,
        code,
        created_by: userId,
        updated_by: userId,
      } as any);

      const savedCandidate = await manager.save(candidate);

      // 3. Save sub-entities
      if (dto.semester_results && dto.semester_results.length > 0) {
        const results = dto.semester_results.map(r => manager.create(ScholarshipCandidateResultEntity, {
          ...r,
          semester_name: r.semester_name || r.semester,
          semester_gpa: r.semester_gpa || r.gpa,
          classification: r.classification || r.rank,
          scholarship_candidate_id: savedCandidate.id,
          created_by: userId,
        }));
        await manager.save(results);
      }

      if (dto.attachments && dto.attachments.length > 0) {
        const attaches = dto.attachments.map(a => manager.create(ScholarshipCandidateAttachmentEntity, {
          ...a,
          scholarship_candidate_id: savedCandidate.id,
          uploaded_by: userId,
        }));
        await manager.save(attaches);
      }

      return savedCandidate;
    });
  }

  async updateCandidate(id: number, dto: UpdateScholarshipCandidateDto, userId?: number) {
    const nationalId = dto.national_id || dto.identity_number;

    return await this.dataSource.transaction(async (manager) => {
      const candidate = await manager.findOne(ScholarshipCandidateEntity, { where: { id } });
      if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

      manager.merge(ScholarshipCandidateEntity, candidate, {
        ...dto,
        dob: (dto.dob || dto.birth_date || null) as any,
        national_id: dto.national_id || dto.identity_number,
        permanent_address: dto.permanent_address || dto.address,
        study_year: dto.study_year || (dto.school_year?.startsWith('Năm') ? dto.school_year : undefined),
        school_year: dto.school_year?.includes('-') ? dto.school_year : (dto.school_year !== undefined ? undefined : candidate.school_year),
        gpa_current: dto.gpa_current || dto.gpa,
        family_context: dto.family_context || dto.family_description,
        income_per_person_per_month: dto.income_per_person_per_month || dto.income_per_capita,
        siblings_in_school_count: dto.siblings_in_school_count || dto.studying_siblings,
        motivation_letter: dto.motivation_letter || dto.essay_content,
        skills_certificates: dto.skills_certificates || dto.skills,
        updated_by: userId,
        updated_at: new Date(),
      } as any);

      await manager.save(candidate);

      // Sync results
      if (dto.semester_results) {
        await manager.delete(ScholarshipCandidateResultEntity, { scholarship_candidate_id: id });
        if (dto.semester_results.length > 0) {
          const results = dto.semester_results.map(r => manager.create(ScholarshipCandidateResultEntity, {
            ...r,
            semester_name: r.semester_name || r.semester,
            semester_gpa: r.semester_gpa || r.gpa,
            classification: r.classification || r.rank,
            scholarship_candidate_id: id,
            created_by: userId,
          }));
          await manager.save(results);
        }
      }

      return { success: true };
    });
  }

  async updateCandidateStatus(id: number, status: string, userId?: number) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

    candidate.status = status;
    if (userId) candidate.updated_by = userId;
    candidate.updated_at = new Date();

    await this.candidateRepo.save(candidate);
    return { success: true };
  }

  async deleteCandidate(id: number) {
    return await this.dataSource.transaction(async (manager) => {
      await manager.delete(ScholarshipCandidateResultEntity, { scholarship_candidate_id: id });
      await manager.delete(ScholarshipCandidateAttachmentEntity, { scholarship_candidate_id: id });
      await manager.delete(ScholarshipCandidateEntity, { id });
      return { success: true };
    });
  }

  async getCandidateDetail(id: number) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

    const [results, attachments, partner] = await Promise.all([
      this.resultRepo.find({ where: { scholarship_candidate_id: id } }),
      this.candidateAttachRepo.find({ where: { scholarship_candidate_id: id } }),
      candidate.university_partner_id ? this.partnerRepo.findOne({ where: { id: candidate.university_partner_id } }) : null,
    ]);

    return {
      ...candidate,
      university_name: partner?.name || candidate.university_name,
      semester_results: results,
      attachments,
    };
  }

  async uploadCandidateAvatar(id: number, file: Express.Multer.File) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh', 'candidates', 'avatars');
    await fs.ensureDir(uploadDir);

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    candidate.avatar_path = `upload/asxh/candidates/avatars/${fileName}`;
    await this.candidateRepo.save(candidate);

    return { path: candidate.avatar_path };
  }

  async uploadCandidateAttachment(id: number, title: string, docType: string, isRequired: boolean, status: string, file: Express.Multer.File, userId?: number) {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    const uploadDir = path.join(process.cwd(), 'upload', 'asxh', 'candidates', 'attachments');
    await fs.ensureDir(uploadDir);

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    const attachment = this.candidateAttachRepo.create({
      scholarship_candidate_id: id,
      title,
      doc_type: docType,
      is_required: isRequired,
      status: status || 'DRAFT',
      path: `upload/asxh/candidates/attachments/${fileName}`,
      uploaded_by: userId,
    });

    return await this.candidateAttachRepo.save(attachment);
  }

  async deleteCandidateAttachment(attachmentId: number) {
    const attachment = await this.candidateAttachRepo.findOne({ where: { id: attachmentId } });
    if (!attachment) throw new NotFoundException('Không tìm thấy tài liệu');

    const fullPath = path.join(process.cwd(), attachment.path);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
    }

    await this.candidateAttachRepo.remove(attachment);
    return { success: true };
  }

  async exportToExcel(school_year: string, userId?: number): Promise<{ buffer: Buffer; filename: string }> {
    const startYear = String(school_year).substring(0, 4);

    // 1. Fetch Data
    const [partnersRaw, candidates, overviewRaw] = await Promise.all([
      // Partners for Excel (No pagination)
      this.partnerRepo.createQueryBuilder('p')
        .leftJoin(UniversityPartnerQuotaEntity, 'q', 'q.university_partner_id = p.id')
        .select('p.*')
        .addSelect('SUM(q.slots)', 'total_slots')
        .addSelect('SUM(CAST(q.slots AS DECIMAL) * q.amount_per_slot)', 'total_budget')
        .where('p.school_year LIKE :startYear', { startYear: `${startYear}%` })
        .groupBy('p.id, p.name, p.short_name, p.code, p.logo_path, p.address, p.website, p.primary_field, p.cooperation_status, p.mou_number, p.expected_sign_date, p.effective_date, p.tcsg_signer_name, p.tcsg_signer_title, p.school_signer_name, p.school_signer_title, p.cooperation_goal, p.min_gpa, p.priority_target, p.school_year, p.cooperation_contents, p.created_at, p.created_by, p.updated_at, p.updated_by')
        .getRawMany(),

      // Candidates for Excel (No pagination, with partner name)
      this.candidateRepo.createQueryBuilder('c')
        .leftJoinAndSelect(UniversityPartnerEntity, 'p', 'p.id = c.university_partner_id')
        .where('c.school_year LIKE :startYear', { startYear: `${startYear}%` })
        .orderBy('c.created_at', 'DESC')
        .getMany(),

      // Overview Metrics for the year
      this.dataSource.query(`
        SELECT 
          (SELECT COUNT(*) FROM university_partners WHERE school_year LIKE @0) as total_partners,
          (SELECT COUNT(*) FROM scholarship_candidates WHERE school_year LIKE @0) as total_candidates,
          (SELECT SUM(slots) FROM university_partner_scholarship_quotas q 
           JOIN university_partners p ON p.id = q.university_partner_id 
           WHERE p.school_year LIKE @0) as total_slots,
          (SELECT SUM(CAST(slots AS DECIMAL) * q.amount_per_slot) FROM university_partner_scholarship_quotas q 
           JOIN university_partners p ON p.id = q.university_partner_id 
           WHERE p.school_year LIKE @0) as total_budget,
          (SELECT SUM(q.amount_per_slot) FROM scholarship_candidates c
           JOIN university_partner_scholarship_quotas q ON q.university_partner_id = c.university_partner_id AND q.major_name = c.major_name
           WHERE c.school_year LIKE @0 AND c.status = 'DISBURSED') as disbursed_budget
      `, [`${startYear}%`]),
    ]);

    const overview = overviewRaw[0];
    const partnerMap = new Map((await this.partnerRepo.find()).map(p => [p.id, p.name]));

    // 2. Build Excel
    const workbook = new ExcelJS.Workbook();
    
    // --- SHEET 1: TỔNG QUAN ---
    const sheet1 = workbook.addWorksheet('Tổng quan');
    sheet1.columns = [{ width: 35 }, { width: 25 }];
    
    sheet1.addRow([`BÁO CÁO TỔNG QUAN HỌC BỔNG - NĂM HỌC ${school_year}`]);
    sheet1.mergeCells('A1:B1');
    sheet1.getRow(1).font = { bold: true, size: 14 };
    sheet1.getRow(1).alignment = { horizontal: 'center' };
    sheet1.addRow([]);

    const metrics = [
      ['Tổng số trường đối tác', overview.total_partners || 0],
      ['Tổng ngân sách dự kiến', (overview.total_budget || 0).toLocaleString() + ' VNĐ'],
      ['Tổng số suất học bổng', overview.total_slots || 0],
      ['Tổng số hồ sơ ứng viên', overview.total_candidates || 0],
      ['Ngân sách đã cấp phát', (overview.disbursed_budget || 0).toLocaleString() + ' VNĐ'],
    ];
    
    metrics.forEach(m => {
      const row = sheet1.addRow(m);
      row.getCell(1).font = { bold: true };
      row.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      row.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- SHEET 2: DANH SÁCH ĐỐI TÁC ---
    const sheet2 = workbook.addWorksheet('DS Đối tác');
    sheet2.columns = [{ width: 5 }, { width: 40 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 }, { width: 20 }];
    const partnerHeaders = ['STT', 'Tên trường', 'Mã trường', 'Năm học', 'Tổng số suất', 'Tổng ngân sách (VNĐ)', 'Trạng thái'];
    sheet2.addRow([`DANH SÁCH ĐỐI TÁC ĐẠI HỌC - ${school_year}`]);
    sheet2.mergeCells(`A1:${String.fromCharCode(64 + partnerHeaders.length)}1`);
    sheet2.getRow(1).font = { bold: true, size: 12 };
    sheet2.getRow(1).alignment = { horizontal: 'center' };
    
    const hRow2 = sheet2.addRow(partnerHeaders);
    hRow2.eachCell(c => {
      c.font = { bold: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    partnersRaw.forEach((p, index) => {
      sheet2.addRow([
        index + 1,
        p.name,
        p.code,
        p.school_year,
        parseInt(p.total_slots || '0'),
        parseFloat(p.total_budget || '0').toLocaleString(),
        p.cooperation_status,
      ]).eachCell(c => {
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // --- SHEET 3: DANH SÁCH ỨNG VIÊN ---
    const sheet3 = workbook.addWorksheet('DS Ứng viên');
    sheet3.columns = [{ width: 5 }, { width: 15 }, { width: 25 }, { width: 40 }, { width: 30 }, { width: 15 }, { width: 10 }, { width: 20 }, { width: 20 }];
    const candidateHeaders = ['STT', 'Mã hồ sơ', 'Họ và tên', 'Trường đại học', 'Chuyên ngành', 'Năm học', 'GPA', 'Nhóm ưu tiên', 'Trạng thái'];
    sheet3.addRow([`DANH SÁCH HỒ SƠ ỨNG VIÊN - ${school_year}`]);
    sheet3.mergeCells(`A1:${String.fromCharCode(64 + candidateHeaders.length)}1`);
    sheet3.getRow(1).font = { bold: true, size: 12 };
    sheet3.getRow(1).alignment = { horizontal: 'center' };
    
    const hRow3 = sheet3.addRow(candidateHeaders);
    hRow3.eachCell(c => {
      c.font = { bold: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    candidates.forEach((c, index) => {
      sheet3.addRow([
        index + 1,
        c.code,
        c.full_name,
        partnerMap.get(c.university_partner_id) || c.university_name,
        c.major_name,
        c.school_year,
        c.gpa_current,
        c.priority_group,
        c.status,
      ]).eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      filename: `Bao_cao_Tai_tro_Giao_duc_${school_year.replace(/\//g, '-')}.xlsx`,
    };
  }
}
