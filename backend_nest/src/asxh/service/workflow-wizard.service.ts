import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { BpmnDesignEntity } from 'src/bpmn-designs/bpmn-design.entity';
import { RoleFeatureEntity } from 'src/role-feature/role-feature-sql/role-feature.entity';
import { RoleFeatureSqlService } from 'src/role-feature/role-feature-sql/role-feature-sql.service';
import { WorkflowEntity } from '../entities/workflow.entity';
import { SaveWorkflowWizardDto } from '../dto/workflow-wizard.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkflowWizardService {
  constructor(
    @InjectRepository(BpmnDesignEntity, 'mssqlConnection')
    private readonly bpmnRepo: Repository<BpmnDesignEntity>,
    @InjectRepository(RoleFeatureEntity, 'mssqlConnection')
    private readonly roleFeatureRepo: Repository<RoleFeatureEntity>,
    @InjectRepository(WorkflowEntity, 'mssqlConnection')
    private readonly workflowRepo: Repository<WorkflowEntity>,
    private readonly roleFeatureService: RoleFeatureSqlService,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
  ) {}

  async saveWizard(dto: SaveWorkflowWizardDto) {
    const result = await this.dataSource.transaction(async (manager: EntityManager) => {
      // Step 1: Save BpmnDesign
      let bpmn = await manager.findOne(BpmnDesignEntity, {
        where: { processKey: dto.processKey },
      });

      if (!bpmn) {
        bpmn = manager.create(BpmnDesignEntity, {
          id: uuidv4(),
          processKey: dto.processKey,
          name: dto.name,
          description: dto.description,
          status: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        bpmn.name = dto.name;
        bpmn.description = dto.description;
        bpmn.updatedAt = new Date();
      }
      await manager.save(bpmn);

      // Step 2: Save RoleFeature
      try {
        const existingRf = await manager.findOne(RoleFeatureEntity, {
          where: { processKey: dto.processKey },
        });

        const rolesData = dto.roles.map(r => ({
          id: uuidv4(),
          name: r.name,
          roleCode: r.roleCode,
          permissions: [],
          users: [],
          groupIds: r.groupIds || [],
        }));

        if (!existingRf) {
          const rf = manager.create(RoleFeatureEntity, {
            id: uuidv4(),
            processKey: dto.processKey,
            roles: rolesData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(rf);
        } else {
          existingRf.roles = rolesData;
          existingRf.updatedAt = new Date();
          await manager.save(existingRf);
        }
      } catch (err) {
        throw new BadRequestException(`Cấu hình vai trò thất bại: ${err.message}`);
      }

      // Step 3: Save Workflows
      await manager.delete(WorkflowEntity, { processKey: dto.processKey });
      
      const workflowSteps = dto.steps.map(s => manager.create(WorkflowEntity, {
        id: uuidv4(),
        processKey: dto.processKey,
        stepOrder: s.stepOrder,
        roleCode: s.roleCode,
        name: s.name || s.roleCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await manager.save(workflowSteps);

      return { success: true, processKey: dto.processKey };
    });

    // Step 4: Sync users (Run outside transaction to avoid deadlock and timeout)
    try {
      await this.roleFeatureService.update(dto.processKey, {
        processKey: dto.processKey,
        roles: dto.roles.map(r => ({
          name: r.name,
          roleCode: r.roleCode,
          permissions: [],
          users: [],
          groupIds: r.groupIds || [],
        })),
      });
    } catch (syncErr) {
      console.error(`User sync failed for ${dto.processKey}:`, syncErr);
      // User sync is heavy but non-critical for the wizard save success UI-wise
    }

    return result;
  }

  async findAll() {
    return await this.bpmnRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getDetail(processKey: string): Promise<SaveWorkflowWizardDto> {
    const bpmn = await this.bpmnRepo.findOne({ where: { processKey } });
    if (!bpmn) throw new BadRequestException('Không tìm thấy quy trình');

    const rf = await this.roleFeatureRepo.findOne({ where: { processKey } });
    const steps = await this.workflowRepo.find({ 
      where: { processKey },
      order: { stepOrder: 'ASC' }
    });

    return {
      name: bpmn.name || '',
      processKey: bpmn.processKey || '',
      description: bpmn.description || '',
      roles: rf?.roles.map(r => ({
        name: r.name,
        roleCode: r.roleCode,
        groupIds: (r as any).groups || (r as any).groupIds || [],
      })) || [],
      steps: steps.map(s => ({
        stepOrder: s.stepOrder,
        roleCode: s.roleCode,
        name: s.name,
      })),
    };
  }

  async delete(processKey: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Delete Workflows
      await manager.delete(WorkflowEntity, { processKey });
      
      // 2. Delete RoleFeature
      await manager.delete(RoleFeatureEntity, { processKey });
      
      // 3. Delete BpmnDesign
      await manager.delete(BpmnDesignEntity, { processKey });

      return { success: true };
    });
  }
}
