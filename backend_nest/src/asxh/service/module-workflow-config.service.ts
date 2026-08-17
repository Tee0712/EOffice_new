import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ModuleWorkflowMappingEntity } from '../entities/module-workflow-mapping.entity';
import { MenuManagerEntity } from '../../menu-manager/entities/menu-manager.entity';
import { WorkflowEntity } from '../entities/workflow.entity';
import { BpmnDesignEntity } from '../../bpmn-designs/bpmn-design.entity';

@Injectable()
export class ModuleWorkflowConfigService {
  constructor(
    @InjectRepository(ModuleWorkflowMappingEntity, 'mssqlConnection')
    private readonly mappingRepo: Repository<ModuleWorkflowMappingEntity>,
    @InjectRepository(MenuManagerEntity, 'mssqlConnection')
    private readonly menuRepo: Repository<MenuManagerEntity>,
    @InjectRepository(WorkflowEntity, 'mssqlConnection')
    private readonly workflowRepo: Repository<WorkflowEntity>,
    @InjectRepository(BpmnDesignEntity, 'mssqlConnection')
    private readonly bpmnRepo: Repository<BpmnDesignEntity>,
  ) {}

  async getModules() {
    const data = await this.menuRepo.find({
      where: { parent: IsNull() }
    });
    return data.map(m => ({
      id: m._id,
      name: m.name,
      code: m.code
    }));
  }

  async getWorkflows() {
    const data = await this.bpmnRepo.find({
      select: ['name', 'processKey'],
      order: { name: 'ASC' }
    });
    return data.map(r => ({
      name: r.name || r.processKey,
      processKey: r.processKey
    }));
  }

  async getMappings() {
    return await this.mappingRepo.find();
  }

  async saveMapping(menuId: string, workflowKey: string) {
    const mId = menuId?.trim().toUpperCase();
    const wKey = workflowKey?.trim();
    let mapping = await this.mappingRepo.findOne({ where: { menuId: mId } });
    if (mapping) {
      mapping.workflowKey = wKey;
    } else {
      mapping = this.mappingRepo.create({ menuId: mId, workflowKey: wKey });
    }
    return await this.mappingRepo.save(mapping);
  }

  async deleteMapping(menuId: string) {
    const mId = menuId?.trim();
    return await this.mappingRepo.delete({ menuId: mId });
  }

  async getWorkflowKeyByMenuId(menuId: string) {
    const mId = menuId?.trim();
    const mapping = await this.mappingRepo.findOne({ where: { menuId: mId } });
    return mapping?.workflowKey || null;
  }

  async getWorkflowKeyByMenuCode(code: string) {
    const menu = await this.menuRepo.findOne({ where: { code } });
    if (!menu) {
      return null;
    }
    return await this.getWorkflowKeyByMenuId(menu._id);
  }
}
