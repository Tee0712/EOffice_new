import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EducationScholarshipService } from './education-scholarship.service';
import { UniversityPartnerEntity } from '../entities/university-partner.entity';
import { UniversityPartnerQuotaEntity } from '../entities/university-partner-quota.entity';
import { UniversityPartnerContactEntity } from '../entities/university-partner-contact.entity';
import { UniversityPartnerAttachmentEntity } from '../entities/university-partner-attachment.entity';
import { ScholarshipCandidateEntity } from '../entities/scholarship-candidate.entity';
import { ScholarshipCandidateResultEntity } from '../entities/scholarship-candidate-result.entity';
import { ScholarshipCandidateAttachmentEntity } from '../entities/scholarship-candidate-attachment.entity';
import { ScholarshipCandidateSequenceEntity } from '../entities/scholarship-candidate-sequence.entity';

describe('EducationScholarshipService', () => {
  let service: EducationScholarshipService;
  let partnerRepo: Repository<UniversityPartnerEntity>;
  let quotaRepo: Repository<UniversityPartnerQuotaEntity>;
  let contactRepo: Repository<UniversityPartnerContactEntity>;
  let partnerAttachRepo: Repository<UniversityPartnerAttachmentEntity>;
  let candidateRepo: Repository<ScholarshipCandidateEntity>;
  let resultRepo: Repository<ScholarshipCandidateResultEntity>;
  let candidateAttachRepo: Repository<ScholarshipCandidateAttachmentEntity>;
  let sequenceRepo: Repository<ScholarshipCandidateSequenceEntity>;
  let dataSource: DataSource;
  let mockEntityManager: any;
  let mockQB: any;

  beforeEach(async () => {
    mockQB = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    const createMockRepo = () => ({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQB),
      findBy: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
    });

    mockEntityManager = {
      save: jest.fn(),
      create: jest.fn((cls, data) => data),
      delete: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationScholarshipService,
        { provide: getRepositoryToken(UniversityPartnerEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(UniversityPartnerQuotaEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(UniversityPartnerContactEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(UniversityPartnerAttachmentEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ScholarshipCandidateEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ScholarshipCandidateResultEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ScholarshipCandidateAttachmentEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ScholarshipCandidateSequenceEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getDataSourceToken('mssqlConnection'), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<EducationScholarshipService>(EducationScholarshipService);
    partnerRepo = module.get(getRepositoryToken(UniversityPartnerEntity, 'mssqlConnection'));
    quotaRepo = module.get(getRepositoryToken(UniversityPartnerQuotaEntity, 'mssqlConnection'));
    contactRepo = module.get(getRepositoryToken(UniversityPartnerContactEntity, 'mssqlConnection'));
    partnerAttachRepo = module.get(getRepositoryToken(UniversityPartnerAttachmentEntity, 'mssqlConnection'));
    candidateRepo = module.get(getRepositoryToken(ScholarshipCandidateEntity, 'mssqlConnection'));
    resultRepo = module.get(getRepositoryToken(ScholarshipCandidateResultEntity, 'mssqlConnection'));
    candidateAttachRepo = module.get(getRepositoryToken(ScholarshipCandidateAttachmentEntity, 'mssqlConnection'));
    sequenceRepo = module.get(getRepositoryToken(ScholarshipCandidateSequenceEntity, 'mssqlConnection'));
    dataSource = module.get(getDataSourceToken('mssqlConnection'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview stats without filter', async () => {
      (partnerRepo.count as jest.Mock).mockResolvedValue(10);
      (candidateRepo.count as jest.Mock).mockResolvedValue(50);
      
      // Order of QB calls in getOverview:
      // 1. candidateRepo QB (stats) -> getRawMany()
      // 2. quotaRepo QB (slots) -> getRawOne()
      // 3. quotaRepo QB (budget) -> getRawOne()
      // 4. candidateRepo QB (disbursed) -> getRawOne()
      // 5. partnerRepo QB (partner stats) -> getRawMany()
      
      mockQB.getRawMany
        .mockResolvedValueOnce([{ status: 'SUBMITTED', count: '20' }, { status: 'DISBURSED', count: '10' }])
        .mockResolvedValueOnce([{ name: 'BK', candidate_count: '5', approved_count: '2' }]);
      
      mockQB.getRawOne
        .mockResolvedValueOnce({ total_slots: '100' })
        .mockResolvedValueOnce({ total_budget: '5000000' })
        .mockResolvedValueOnce({ disbursed_budget: '1000000' });

      const result = await service.getOverview();

      expect(result).toBeDefined();
      expect(result.total_partners).toBe(10);
      expect(result.total_candidates).toBe(50);
      expect(result.total_approved_candidates).toBe(10);
      expect(result.total_slots).toBe(100);
      expect(result.total_budget).toBe(5000000);
      expect(result.disbursed_budget).toBe(1000000);
    });
  });

  describe('Partners CRUD', () => {
    it('should find partners with filters', async () => {
      mockQB.getCount.mockResolvedValue(1);
      mockQB.getRawMany.mockResolvedValue([{ p_id: 1, p_name: 'Bach Khoa', slots: '10' }]);

      const result = await service.findPartners({ keyword: 'BK', page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Bach Khoa');
      expect(result.total).toBe(1);
    });

    it('should create a partner with transaction', async () => {
      const dto = {
        name: 'University A',
        code: 'UNI_A',
        cooperation_status: 'ACTIVE',
        quotas: [{ major_name: 'IT', slots: 10, amount_per_slot: 1000 }],
        contacts: [{ name: 'Contact A', position: 'Manager' }],
      };

      mockEntityManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 1, ...entity });
      });

      const result = await service.createPartner(dto as any, 1);

      expect(result.id).toBe(1);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should fail to create partner if code exists', async () => {
      (partnerRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, code: 'EXISTING' });

      await expect(service.createPartner({ code: 'EXISTING' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should toggle partner status', async () => {
      (partnerRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, cooperation_status: 'PAUSED' });
      
      const result = await service.togglePartnerStatus(1, 1);

      expect(result.status).toBe('NEGOTIATING');
      expect(partnerRepo.save).toHaveBeenCalled();
    });
  });

  describe('Candidates CRUD', () => {
    it('should create a candidate and generate sequence code', async () => {
      const dto = {
        full_name: 'Student A',
        university_partner_id: 1,
        major_name: 'IT',
        school_year: '2025-2026',
        semester_results: [{ semester: 'HK1', gpa_current: 3.8, credits: 20 }],
      };

      mockEntityManager.findOne.mockResolvedValue({ year: 2026, next_candidate_no: 5 });
      mockEntityManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 10, ...entity });
      });

      const result = await service.createCandidate(dto as any, 1);

      expect(result.id).toBe(10);
      expect(result.code).toBe('HB-2026/0005');
      // Calls to save: sequence, candidate, results
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
    });

    it('should get candidate detail', async () => {
      (candidateRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, full_name: 'A', university_partner_id: 1 });
      (resultRepo.find as jest.Mock).mockResolvedValue([]);
      (candidateAttachRepo.find as jest.Mock).mockResolvedValue([]);
      (partnerRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'University X' });

      const result = await service.getCandidateDetail(1);

      expect(result.full_name).toBe('A');
      expect(result.university_name).toBe('University X');
    });

    it('should delete candidate and nested entities', async () => {
      const result = await service.deleteCandidate(1);

      expect(result.success).toBe(true);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.delete).toHaveBeenCalled();
    });
  });
});
