import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommonWorkflowEntity } from './entities/common-workflow.entity';
import { SaveWorkflowDto } from './dto/workflow-config.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommonWorkflowService {
  private readonly logger = new Logger(CommonWorkflowService.name);
  private readonly defaultModuleType = 'VPP';

  constructor(
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
    @InjectRepository(CommonWorkflowEntity, 'mssqlConnection')
    private readonly workflowRepo: Repository<CommonWorkflowEntity>,
  ) {}

  /**
   * Lay danh sach loai luong phe duyet (module_type) tu bang common_workflows
   */
  async getModuleTypes() {
    try {
      const rows = await this.workflowRepo
        .createQueryBuilder('cw')
        .select('DISTINCT cw.moduleType', 'moduleType')
        .where('cw.moduleType IS NOT NULL')
        .andWhere("LTRIM(RTRIM(cw.moduleType)) <> ''")
        .orderBy('cw.moduleType', 'ASC')
        .getRawMany<{ moduleType: string }>();

      const types = (rows || [])
        .map((row) => (row?.moduleType || '').trim())
        .filter((value) => !!value);

      if (!types.includes(this.defaultModuleType)) {
        types.unshift(this.defaultModuleType);
      }

      // Ensure uniqueness while keeping order (default first).
      const unique = Array.from(new Set(types));

      return {
        success: true,
        data: unique,
      };
    } catch (error) {
      this.logger.error(`Error fetching module types: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Loi co so du lieu khi lay danh sach loai luong duyet');
    }
  }

  /**
   * Lấy cấu hình luồng phê duyệt theo phòng ban và loại module
   */
  async getWorkflows(departmentId?: string, moduleType: string = 'VPP') {
    const effectiveModuleType = (moduleType || this.defaultModuleType).trim() || this.defaultModuleType;
    this.logger.log(`Fetching workflow config for module: [${effectiveModuleType}]`);

    try {
      const qb = this.workflowRepo
        .createQueryBuilder('cw')
        // Be tolerant to accidental trailing/leading spaces in DB values.
        .where("LTRIM(RTRIM(cw.moduleType)) = :moduleType", { moduleType: effectiveModuleType });

      if (departmentId) {
        qb.andWhere('cw.departmentId = :departmentId', { departmentId });
      }

      const rows = await qb.orderBy('cw.stepOrder', 'ASC').getMany();

      return {
        success: true,
        data: rows,
      };
    } catch (error) {
      this.logger.error(`Error fetching workflow config: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Lỗi cơ sở dữ liệu khi lấy thông tin luồng duyệt');
    }
  }

  /**
   * Lưu cấu hình luồng phê duyệt (Sử dụng Transaction để đảm bảo tính toàn vẹn)
   */
  async saveWorkflow(payload: SaveWorkflowDto) {
    const { departmentId, steps } = payload;
    const moduleType = (payload.moduleType || this.defaultModuleType).trim() || this.defaultModuleType;
    const incomingSteps = steps || [];

    if (!incomingSteps.length) {
      throw new BadRequestException('Luồng duyệt phải có ít nhất 1 bước.');
    }

    const approverIds = incomingSteps
      .map((step) => step?.approverId)
      .filter((id): id is string => !!id);
    if (!approverIds.length) {
      throw new BadRequestException('Danh sách approver không hợp lệ.');
    }

    const duplicateApprovers = approverIds.filter((id, idx) => approverIds.indexOf(id) !== idx);
    if (duplicateApprovers.length) {
      throw new BadRequestException('Luồng duyệt không được chứa trùng approver.');
    }

    this.logger.log(`Saving workflow config for department: [${departmentId}], module: [${moduleType}], steps count: [${steps?.length || 0}]`);

    try {
      await this.dataSource.transaction(async (manager) => {
        const approverRows: Array<{ id: string; parent: string | null; name: string | null }> =
          await manager
            .createQueryBuilder()
            .select('u.id', 'id')
            .addSelect('u.parent', 'parent')
            .addSelect('u.name', 'name')
            .from('dbo.users', 'u')
            .where('u.status = :status', { status: 1 })
            .andWhere('u.id IN (:...ids)', { ids: approverIds })
            .getRawMany();

        if (approverRows.length !== approverIds.length) {
          throw new BadRequestException('Có approver không tồn tại hoặc đã bị khóa.');
        }

        const approverMap = new Map(
          approverRows.map((row) => [row.id, row]),
        );

        const existingSteps = await manager.find(CommonWorkflowEntity, {
          where: { moduleType },
          order: { stepOrder: 'ASC' },
        });

        const existingByApprover = new Map(
          existingSteps.map((step) => [step.approverId, step]),
        );
        const touchedIds = new Set<string>();
        const entitiesToSave: CommonWorkflowEntity[] = [];

        for (let idx = 0; idx < incomingSteps.length; idx += 1) {
          const payloadStep = incomingSteps[idx];
          const approver = approverMap.get(payloadStep.approverId);
          if (!approver?.parent) {
            throw new BadRequestException(`Approver ${payloadStep.approverId} không có phòng ban hợp lệ.`);
          }

          const existingEntity = existingByApprover.get(payloadStep.approverId);
          const entity = existingEntity || new CommonWorkflowEntity();
          entity.id = existingEntity?.id || uuidv4();
          entity.departmentId = approver.parent;
          entity.moduleType = moduleType;
          entity.stepOrder = payloadStep.stepOrder ?? idx + 1;
          entity.approverId = payloadStep.approverId;
          entity.approverType = payloadStep.approverType || 'USER';
          entitiesToSave.push(entity);
          touchedIds.add(payloadStep.approverId);
        }

        const toRemove = existingSteps.filter((step) => !touchedIds.has(step.approverId));
        if (toRemove.length > 0) {
          await manager.remove(toRemove);
        }
        if (entitiesToSave.length > 0) {
          await manager.save(entitiesToSave);
          await manager.query(
            `
            UPDATE cw
            SET cw.department_id = u.parent
            FROM dbo.common_workflows cw
            INNER JOIN dbo.users u ON u.id = cw.approver_id
            WHERE cw.module_type = @0
              AND cw.approver_id IN (${approverIds.map((_, idx) => `@${idx + 1}`).join(', ')})
            `,
            [moduleType, ...approverIds],
          );
        }
      });

      return {
        success: true,
        message: 'Lưu cấu hình quy trình thành công',
      };
    } catch (error) {
      this.logger.error(`Transaction failed while saving workflow config: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Lỗi hệ thống khi lưu cấu hình: ${error.message}`);
    }
  }
}
