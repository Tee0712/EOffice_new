import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AsxhInKindService } from './asxh-in-kind.service';
import { AssetEntity } from '../entities/asset.entity';
import { AssetSpecificationEntity } from '../entities/asset-specification.entity';
import { AssetAttachmentEntity } from '../entities/asset-attachment.entity';
import { HandoverAssetEntity } from '../entities/handover-asset.entity';
import { ProgramEntity } from '../entities/program.entity';
import { ProgramItemEntity } from '../entities/program-item.entity';
import { ProgramAssetSequenceEntity } from '../entities/program-asset-sequence.entity';
import { AsxhSupplierEntity } from '../entities/asxh-supplier.entity';
import { UserEntity } from 'src/users/entities/user.entity';

describe('AsxhInKindService', () => {
  let service: AsxhInKindService;
  let assetRepo: Repository<AssetEntity>;
  let specRepo: Repository<AssetSpecificationEntity>;
  let attachmentRepo: Repository<AssetAttachmentEntity>;
  let handoverRepo: Repository<HandoverAssetEntity>;
  let programRepo: Repository<ProgramEntity>;
  let programItemRepo: Repository<ProgramItemEntity>;
  let sequenceRepo: Repository<ProgramAssetSequenceEntity>;
  let supplierRepo: Repository<AsxhSupplierEntity>;
  let userRepo: Repository<UserEntity>;
  let dataSource: DataSource;
  let mockEntityManager: any;
  let mockQB: any;

  beforeEach(async () => {
    mockQB = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
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
      remove: jest.fn(),
      update: jest.fn(),
    });

    mockEntityManager = {
      findOne: jest.fn(),
      create: jest.fn((cls, data) => data ?? {}), // Fixed to return empty object if data is missing
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      getRepository: jest.fn().mockReturnThis(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
      getRepository: jest.fn().mockReturnValue(mockEntityManager),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsxhInKindService,
        { provide: getRepositoryToken(AssetEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(AssetSpecificationEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(AssetAttachmentEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(HandoverAssetEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ProgramEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ProgramItemEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(ProgramAssetSequenceEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(AsxhSupplierEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getRepositoryToken(UserEntity, 'mssqlConnection'), useValue: createMockRepo() },
        { provide: getDataSourceToken('mssqlConnection'), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AsxhInKindService>(AsxhInKindService);
    assetRepo = module.get(getRepositoryToken(AssetEntity, 'mssqlConnection'));
    specRepo = module.get(getRepositoryToken(AssetSpecificationEntity, 'mssqlConnection'));
    attachmentRepo = module.get(getRepositoryToken(AssetAttachmentEntity, 'mssqlConnection'));
    handoverRepo = module.get(getRepositoryToken(HandoverAssetEntity, 'mssqlConnection'));
    programRepo = module.get(getRepositoryToken(ProgramEntity, 'mssqlConnection'));
    programItemRepo = module.get(getRepositoryToken(ProgramItemEntity, 'mssqlConnection'));
    sequenceRepo = module.get(getRepositoryToken(ProgramAssetSequenceEntity, 'mssqlConnection'));
    supplierRepo = module.get(getRepositoryToken(AsxhSupplierEntity, 'mssqlConnection'));
    userRepo = module.get(getRepositoryToken(UserEntity, 'mssqlConnection'));
    dataSource = module.get(getDataSourceToken('mssqlConnection'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview with KPIs', async () => {
      (programRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, code: 'P/001', name: 'Program 1' });
      
      mockQB.getRawOne
        .mockResolvedValueOnce({ total: '1000' }) // total_budget
        .mockResolvedValueOnce({ total: '600' });  // total_asset_value
      
      mockQB.getRawMany.mockResolvedValueOnce([
        { status: 'RECEIVED', count: '5' },
        { status: 'PURCHASED', count: '2' },
      ]);

      const result = await service.getOverview(1);

      expect(result.kpi.total_budget).toBe(1000);
      expect(result.kpi.total_asset_value).toBe(600);
      expect(result.kpi.remaining_budget).toBe(400);
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].done_items).toBe(7); // 5 + 2
    });
  });

  describe('Asset Management', () => {
    it('should create an asset with sequence', async () => {
      mockEntityManager.findOne
        .mockResolvedValueOnce({ id: 1, code: 'ASXH/001' }) // program
        .mockResolvedValueOnce({ programId: 1, nextAssetNo: 5 }); // sequence
      
      mockEntityManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 55, ...entity });
      });

      const dto = {
        name: 'Máy tính',
        unit_price: 15000000,
        quantity: 10,
        required_receipt_date: '2026-05-01',
        specifications: [{ parameter_name: 'RAM', value: '8GB' }]
      };

      const result = await service.createAsset(1, dto as any);

      expect(result.id).toBe(55);
      expect(result.code).toBe('HV-001/05');
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3); // sequence, asset, specs
    });

    it('should update an asset and sync specs', async () => {
      mockEntityManager.findOne.mockResolvedValue({ id: 10, name: 'Old Name' });
      mockEntityManager.save.mockResolvedValue({ id: 10 });

      const dto = {
        name: 'New Name',
        specifications: [{ parameter_name: 'Color', value: 'Red' }]
      };

      const result = await service.updateAsset(10, dto as any);

      expect(result.success).toBe(true);
      expect(mockEntityManager.delete).toHaveBeenCalledWith(AssetSpecificationEntity, { assetId: 10 });
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2); // asset, specs
    });

    it('should prevent deleting asset if not in RECEIVED status', async () => {
      (assetRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'PURCHASED' });

      await expect(service.deleteAsset(1)).rejects.toThrow(BadRequestException);
    });

    it('should delete asset and nested items', async () => {
      const asset = { id: 20, status: 'RECEIVED', path: 'upload/a.png' };
      (assetRepo.findOne as jest.Mock).mockResolvedValue(asset);
      mockEntityManager.find.mockResolvedValue([]); // attachments
      mockEntityManager.remove.mockResolvedValue({ success: true });

      const result = await service.deleteAsset(20);

      expect(result.success).toBe(true);
      expect(mockEntityManager.delete).toHaveBeenCalledTimes(2); // specs, attachments
      expect(mockEntityManager.remove).toHaveBeenCalled();
    });
  });

  describe('Handover Module', () => {
    it('should create handover batch', async () => {
      mockEntityManager.findOne.mockResolvedValue({ id: 1, code: 'P1' });
      mockEntityManager.save.mockImplementation((entity) => {
        if (Array.isArray(entity)) return Promise.resolve(entity);
        return Promise.resolve({ id: 1, ...entity });
      });

      const dto = {
        event_name: 'Lễ bàn giao',
        asset_ids: [1, 2],
        attendees: [{ user_id: 'u1', role: 'Leader' }],
        checklist: [{ name: 'Check item', checklist_type: 'REQUIRED' }]
      };

      const result = await service.createHandoverBatch(1, dto as any, 'admin');

      expect(result.id).toBe(1);
      expect(mockEntityManager.update).toHaveBeenCalledWith(AssetEntity, { id: In([1, 2]) }, { handoverAssetId: 1 });
      expect(mockEntityManager.save).toHaveBeenCalledTimes(4); // handover, attendees, checklist, log
    });
  });

  describe('Supplier Management', () => {
    it('should create a supplier with valid data', async () => {
      const dto = {
        name: 'Công ty ABC',
        tax_code: '123456789',
        phone: '0987654321',
        email: 'abc@gmail.com',
        supplier_type: 'Đại lý'
      };

      (supplierRepo.create as jest.Mock).mockReturnValue(dto);
      (supplierRepo.save as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      const result = await service.createSupplier(dto as any);

      expect(result.id).toBe(1);
      expect(supplierRepo.save).toHaveBeenCalled();
    });

    it('should update supplier data', async () => {
      (supplierRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'Old Name' });
      (supplierRepo.save as jest.Mock).mockResolvedValue({ id: 1, name: 'New Name' });

      const result = await service.updateSupplier(1, { name: 'New Name' } as any);

      expect(result.name).toBe('New Name');
      expect(supplierRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if supplier to update does not exist', async () => {
      (supplierRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateSupplier(999, { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should delete a supplier', async () => {
      const supplier = { id: 1 };
      (supplierRepo.findOne as jest.Mock).mockResolvedValue(supplier);
      (supplierRepo.remove as jest.Mock).mockResolvedValue({ success: true });

      const result = await service.deleteSupplier(1);

      expect(result.success).toBe(true);
      expect(supplierRepo.remove).toHaveBeenCalledWith(supplier);
    });
  });

  describe('Exception Handling & Business Logic', () => {
    it('should throw NotFoundException if program not found in getOverview', async () => {
      (programRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getOverview(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting asset not in RECEIVED status', async () => {
      (assetRepo.findOne as jest.Mock).mockResolvedValue({ id: 1, status: 'PURCHASED' });
      await expect(service.deleteAsset(1)).rejects.toThrow(BadRequestException);
    });

    it('should handle pagination in getAssets', async () => {
      mockQB.getManyAndCount.mockResolvedValue([[ { id: 1 } ], 1]);
      
      const result = await service.getAssets(1, { page: 1, page_size: 10 } as any);
      
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
