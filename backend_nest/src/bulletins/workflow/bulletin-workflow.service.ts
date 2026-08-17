import { Injectable, NotFoundException, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { BulletinEntity, BulletinPriority, BulletinStatus, BulletinType } from './entities/bulletin.entity';
import { BulletinApprovalHistoryEntity, BulletinAction } from './entities/history.entity';
import { DepartmentApprovalWorkflowEntity, ApproverType } from './entities/workflow.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';

@Injectable()
export class BulletinWorkflowService implements OnModuleInit {
  constructor(
    @InjectRepository(BulletinEntity, 'mssqlConnection')
    private bulletinRepository: Repository<BulletinEntity>,
    @InjectRepository(BulletinApprovalHistoryEntity, 'mssqlConnection')
    private historyRepository: Repository<BulletinApprovalHistoryEntity>,
    @InjectRepository(DepartmentApprovalWorkflowEntity, 'mssqlConnection')
    private workflowRepository: Repository<DepartmentApprovalWorkflowEntity>,
    private permissionsService: PermissionsService,
  ) { }

  async onModuleInit() {
    try {
      await this.ensureBulletinTables();
    } catch (error) {
      console.warn('[BulletinWorkflowService] Skip ensureBulletinTables:', error?.message || error);
    }
    try {
      await this.ensureBulletinColumns();
    } catch (error) {
      // Do not crash module boot if database user cannot alter schema.
      // Runtime APIs will continue working with existing columns.
      console.warn('[BulletinWorkflowService] Skip ensureBulletinColumns:', error?.message || error);
    }
    try {
      await this.ensureWorkflowColumns();
    } catch (error) {
      console.warn('[BulletinWorkflowService] Skip ensureWorkflowColumns:', error?.message || error);
    }
  }

  private async ensureBulletinTables() {
    await this.bulletinRepository.query(`
      IF OBJECT_ID(N'[dbo].[bulletins]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[bulletins] (
          [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletins] PRIMARY KEY DEFAULT NEWID(),
          [title] NVARCHAR(500) NOT NULL,
          [content] NVARCHAR(MAX) NOT NULL,
          [bulletin_type] NVARCHAR(50) NOT NULL CONSTRAINT [DF_bulletins_bulletin_type] DEFAULT 'NEWS',
          [priority] NVARCHAR(20) NOT NULL CONSTRAINT [DF_bulletins_priority] DEFAULT 'NORMAL',
          [department_id] UNIQUEIDENTIFIER NOT NULL,
          [author_id] NVARCHAR(100) NOT NULL,
          [status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_bulletins_status] DEFAULT 'DRAFT',
          [current_step] INT NOT NULL CONSTRAINT [DF_bulletins_current_step] DEFAULT 1,
          [tags] NVARCHAR(MAX) NULL,
          [attachments] NVARCHAR(MAX) NULL,
          [scheduled_publish_at] DATETIME NULL,
          [view_count] INT NOT NULL CONSTRAINT [DF_bulletins_view_count] DEFAULT 0,
          [created_at] DATETIME NOT NULL CONSTRAINT [DF_bulletins_created_at] DEFAULT GETDATE(),
          [updated_at] DATETIME NOT NULL CONSTRAINT [DF_bulletins_updated_at] DEFAULT GETDATE()
        );

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bulletins_department_id' AND object_id = OBJECT_ID(N'[dbo].[bulletins]'))
          CREATE INDEX [IX_bulletins_department_id] ON [dbo].[bulletins]([department_id]);
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bulletins_author_id' AND object_id = OBJECT_ID(N'[dbo].[bulletins]'))
          CREATE INDEX [IX_bulletins_author_id] ON [dbo].[bulletins]([author_id]);
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bulletins_status' AND object_id = OBJECT_ID(N'[dbo].[bulletins]'))
          CREATE INDEX [IX_bulletins_status] ON [dbo].[bulletins]([status]);
      END
    `);

    await this.historyRepository.query(`
      IF OBJECT_ID(N'[dbo].[bulletin_approval_histories]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[bulletin_approval_histories] (
          [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_bulletin_approval_histories] PRIMARY KEY DEFAULT NEWID(),
          [bulletin_id] UNIQUEIDENTIFIER NOT NULL,
          [step_order] INT NOT NULL,
          [actor_id] NVARCHAR(100) NOT NULL,
          [action] NVARCHAR(50) NOT NULL,
          [comment] NVARCHAR(MAX) NULL,
          [created_at] DATETIME NOT NULL CONSTRAINT [DF_bulletin_histories_created_at] DEFAULT GETDATE()
        );

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bulletin_histories_bulletin_id' AND object_id = OBJECT_ID(N'[dbo].[bulletin_approval_histories]'))
          CREATE INDEX [IX_bulletin_histories_bulletin_id] ON [dbo].[bulletin_approval_histories]([bulletin_id]);
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bulletin_histories_actor_id' AND object_id = OBJECT_ID(N'[dbo].[bulletin_approval_histories]'))
          CREATE INDEX [IX_bulletin_histories_actor_id] ON [dbo].[bulletin_approval_histories]([actor_id]);
      END
    `);
  }

  private async ensureBulletinColumns() {
    await this.bulletinRepository.query(`
      IF OBJECT_ID(N'[dbo].[bulletins]', N'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'bulletin_type')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [bulletin_type] nvarchar(50) NOT NULL CONSTRAINT DF_bulletins_bulletin_type DEFAULT 'NEWS'
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'priority')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [priority] nvarchar(20) NOT NULL CONSTRAINT DF_bulletins_priority DEFAULT 'NORMAL'
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'tags')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [tags] nvarchar(max) NULL
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'attachments')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [attachments] nvarchar(max) NULL
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'scheduled_publish_at')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [scheduled_publish_at] datetime NULL
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'view_count')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [view_count] int NOT NULL CONSTRAINT DF_bulletins_view_count DEFAULT 0
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[bulletins]') AND name = 'viewer_department_ids')
        BEGIN
          ALTER TABLE [dbo].[bulletins] ADD [viewer_department_ids] nvarchar(max) NULL
        END
      END
    `);
  }

  private async ensureWorkflowColumns() {
    await this.workflowRepository.query(`
      IF OBJECT_ID(N'[dbo].[department_approval_workflows]', N'U') IS NULL
      BEGIN
        CREATE TABLE [dbo].[department_approval_workflows] (
          [id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_department_approval_workflows] PRIMARY KEY DEFAULT NEWID(),
          [department_id] UNIQUEIDENTIFIER NOT NULL,
          [step_order] INT NOT NULL,
          [approver_type] NVARCHAR(50) NOT NULL,
          [approver_id] NVARCHAR(100) NOT NULL,
          [step_name] NVARCHAR(255) NULL,
          [sla_hours] INT NULL,
          [is_required] BIT NOT NULL CONSTRAINT [DF_workflow_is_required] DEFAULT 1,
          [min_approvals] INT NOT NULL CONSTRAINT [DF_workflow_min_approvals] DEFAULT 1,
          [can_auto_publish] BIT NOT NULL CONSTRAINT [DF_workflow_can_auto_publish] DEFAULT 0,
          [publish_channel] NVARCHAR(100) NULL,
          [notify_scope] NVARCHAR(100) NULL,
          [on_reject_action] NVARCHAR(50) NOT NULL CONSTRAINT [DF_workflow_on_reject_action] DEFAULT 'RETURN_TO_DRAFT',
          [is_active] BIT NOT NULL CONSTRAINT [DF_workflow_is_active] DEFAULT 1,
          [config_json] NVARCHAR(MAX) NULL
        );

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_workflow_department_step' AND object_id = OBJECT_ID(N'[dbo].[department_approval_workflows]'))
          CREATE INDEX [IX_workflow_department_step] ON [dbo].[department_approval_workflows]([department_id], [step_order]);
      END

      IF OBJECT_ID(N'[dbo].[department_approval_workflows]', N'U') IS NOT NULL
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'step_name')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [step_name] nvarchar(255) NULL

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'sla_hours')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [sla_hours] int NULL

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'is_required')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [is_required] bit NOT NULL CONSTRAINT DF_workflow_is_required DEFAULT 1

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'min_approvals')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [min_approvals] int NOT NULL CONSTRAINT DF_workflow_min_approvals DEFAULT 1

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'can_auto_publish')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [can_auto_publish] bit NOT NULL CONSTRAINT DF_workflow_can_auto_publish DEFAULT 0

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'publish_channel')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [publish_channel] nvarchar(100) NULL

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'notify_scope')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [notify_scope] nvarchar(100) NULL

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'on_reject_action')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [on_reject_action] nvarchar(50) NOT NULL CONSTRAINT DF_workflow_on_reject_action DEFAULT 'RETURN_TO_DRAFT'

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'is_active')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [is_active] bit NOT NULL CONSTRAINT DF_workflow_is_active DEFAULT 1

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[department_approval_workflows]') AND name = 'config_json')
          ALTER TABLE [dbo].[department_approval_workflows] ADD [config_json] nvarchar(max) NULL
      END
    `);
  }

  async findAll(
    userId: string,
    isAdmin: boolean,
    filters?: { department_id?: string; status?: string; bulletin_type?: string; keyword?: string }
  ) {
    const query = this.bulletinRepository.createQueryBuilder('bulletin')
      .leftJoinAndSelect('bulletin.department', 'department')
      .leftJoinAndSelect('bulletin.author', 'author')
      .orderBy('bulletin.created_at', 'DESC');

    if (!isAdmin) {
      // Logic for filtering by department via user permissions
      const userRoles = await this.permissionsService.getUserRolesInDepartment(userId, undefined);
      const deptIds = userRoles.map(ur => ur.department_id);
      if (deptIds.length === 0) return [];

      query.andWhere(new Brackets(qb => {
        qb.where('bulletin.department_id IN (:...deptIds)', { deptIds })
          .orWhere('bulletin.viewer_department_ids LIKE :allScope', { allScope: '%"ALL"%' });

        deptIds.forEach((id, idx) => {
          qb.orWhere(`bulletin.viewer_department_ids LIKE :deptId${idx}`, { [`deptId${idx}`]: `%${id}%` });
        });
      }));
    }

    if (filters?.department_id && filters.department_id !== 'ALL') {
      const deptId = filters.department_id;
      query.andWhere(new Brackets(qb => {
        qb.where('bulletin.department_id = :deptId', { deptId })
          .orWhere('bulletin.viewer_department_ids LIKE :deptIdInScope', { deptIdInScope: `%${deptId}%` })
          .orWhere('bulletin.viewer_department_ids LIKE :allScope', { allScope: '%"ALL"%' });
      }));
    }
    if (filters?.status) {
      query.andWhere('bulletin.status = :status', { status: filters.status });
    }
    if (filters?.bulletin_type) {
      query.andWhere('bulletin.bulletin_type = :bulletinType', { bulletinType: filters.bulletin_type });
    }
    if (filters?.keyword?.trim()) {
      query.andWhere('(bulletin.title LIKE :keyword OR bulletin.content LIKE :keyword)', {
        keyword: `%${filters.keyword.trim()}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const bulletin = await this.bulletinRepository.findOne({
      where: { id },
      relations: ['department', 'author', 'histories', 'histories.actor']
    });
    if (!bulletin) throw new NotFoundException('Bulletin not found');
    return bulletin;
  }

  async create(userId: string, dto: CreateBulletinDto) {
    const canCreate = await this.permissionsService.checkPermission(userId, dto.department_id, 'CREATE_NEWS');
    if (!canCreate) throw new ForbiddenException('No permission to create news in this department');

    const bulletin = this.bulletinRepository.create({
      title: dto.title,
      content: dto.content,
      department_id: dto.department_id,
      bulletinType: dto.bulletin_type || BulletinType.NEWS,
      priority: dto.priority || BulletinPriority.NORMAL,
      tags: JSON.stringify(Array.isArray(dto.tags) ? dto.tags : []),
      attachments: JSON.stringify(Array.isArray(dto.attachments) ? dto.attachments : []),
      scheduledPublishAt: dto.auto_schedule && dto.scheduled_publish_at
        ? new Date(dto.scheduled_publish_at)
        : null,
      author_id: userId,
      status: BulletinStatus.DRAFT,
      current_step: 1,
      viewerDepartmentIds: JSON.stringify(Array.isArray(dto.viewer_department_ids) ? dto.viewer_department_ids : [])
    });
    return this.bulletinRepository.save(bulletin);
  }

  async update(id: string, userId: string, dto: CreateBulletinDto) {
    const bulletin = await this.findOne(id);
    if (bulletin.author_id !== userId) throw new ForbiddenException('Only author can edit');
    if (bulletin.status !== BulletinStatus.DRAFT && bulletin.status !== BulletinStatus.REJECTED && bulletin.status !== BulletinStatus.REQUIRE_EDIT) {
      throw new BadRequestException('Cannot edit bulletin in this status');
    }

    bulletin.title = dto.title;
    bulletin.content = dto.content;
    bulletin.department_id = dto.department_id;
    bulletin.bulletinType = dto.bulletin_type || BulletinType.NEWS;
    bulletin.priority = dto.priority || BulletinPriority.NORMAL;
    bulletin.tags = JSON.stringify(Array.isArray(dto.tags) ? dto.tags : []);
    bulletin.attachments = JSON.stringify(Array.isArray(dto.attachments) ? dto.attachments : []);
    bulletin.scheduledPublishAt = dto.auto_schedule && dto.scheduled_publish_at
      ? new Date(dto.scheduled_publish_at)
      : null;
    bulletin.viewerDepartmentIds = JSON.stringify(Array.isArray(dto.viewer_department_ids) ? dto.viewer_department_ids : []);

    return this.bulletinRepository.save(bulletin);
  }

  async submit(id: string, userId: string) {
    const bulletin = await this.findOne(id);
    if (bulletin.author_id !== userId) throw new ForbiddenException('Only author can submit');
    if (bulletin.status !== BulletinStatus.DRAFT && bulletin.status !== BulletinStatus.REQUIRE_EDIT && bulletin.status !== BulletinStatus.REJECTED) {
      throw new BadRequestException('Invalid status to submit');
    }

    bulletin.status = BulletinStatus.PENDING;
    bulletin.current_step = 1;
    await this.bulletinRepository.save(bulletin);

    await this.logHistory(id, userId, 1, BulletinAction.SUBMITTED, 'Submitted for approval');
    return bulletin;
  }

  async approve(id: string, userId: string) {
    const bulletin = await this.findOne(id);
    if (bulletin.status !== BulletinStatus.PENDING) throw new BadRequestException('Not pending approval');

    const workflow = await this.workflowRepository.findOne({
      where: { department_id: bulletin.department_id, step_order: bulletin.current_step }
    });

    // Fallback for environments chưa cấu hình workflow:
    // cho phép duyệt trực tiếp nếu user có quyền APPROVE_NEWS trong phòng ban.
    if (!workflow) {
      const canApproveDirectly = await this.permissionsService.checkPermission(
        userId,
        bulletin.department_id,
        'APPROVE_NEWS',
      );
      if (!canApproveDirectly) {
        throw new ForbiddenException('No permission to approve in this department');
      }

      bulletin.status = BulletinStatus.APPROVED;
      await this.bulletinRepository.save(bulletin);
      await this.logHistory(
        id,
        userId,
        bulletin.current_step,
        BulletinAction.APPROVED,
        'Approved without workflow configuration',
      );
      return bulletin;
    }

    const canApprove = await this.checkWorkflowPermission(userId, workflow);
    if (!canApprove) throw new ForbiddenException('No permission to approve at this step');

    const nextStep = await this.workflowRepository.findOne({
      where: { department_id: bulletin.department_id, step_order: bulletin.current_step + 1 }
    });

    if (nextStep) {
      bulletin.current_step++;
    } else {
      bulletin.status = BulletinStatus.APPROVED;
    }

    await this.bulletinRepository.save(bulletin);
    await this.logHistory(id, userId, bulletin.current_step, BulletinAction.APPROVED);
    return bulletin;
  }

  async reject(id: string, userId: string, comment: string) {
    const bulletin = await this.findOne(id);
    const workflow = await this.workflowRepository.findOne({
      where: { department_id: bulletin.department_id, step_order: bulletin.current_step }
    });

    if (!workflow) {
      const canRejectDirectly = await this.permissionsService.checkPermission(
        userId,
        bulletin.department_id,
        'APPROVE_NEWS',
      );
      if (!canRejectDirectly) {
        throw new ForbiddenException('No permission to reject in this department');
      }
    } else {
      const canApprove = await this.checkWorkflowPermission(userId, workflow);
      if (!canApprove) throw new ForbiddenException('No permission to reject at this step');
    }

    bulletin.status = BulletinStatus.REJECTED;
    await this.bulletinRepository.save(bulletin);
    await this.logHistory(id, userId, bulletin.current_step, BulletinAction.REJECTED, comment);
    return bulletin;
  }

  async publish(id: string, userId: string) {
    const bulletin = await this.findOne(id);
    if (bulletin.status !== BulletinStatus.APPROVED) throw new BadRequestException('Must be APPROVED first');

    const canPublish = await this.permissionsService.checkPermission(userId, bulletin.department_id, 'PUBLISH_NEWS');
    if (!canPublish) throw new ForbiddenException('No permission to publish');

    bulletin.status = BulletinStatus.PUBLISHED;
    await this.bulletinRepository.save(bulletin);
    await this.logHistory(id, userId, bulletin.current_step, BulletinAction.PUBLISHED, 'Published corporate-wide');
    return bulletin;
  }

  async unpublish(id: string, userId: string) {
    const bulletin = await this.findOne(id);
    if (bulletin.status !== BulletinStatus.PUBLISHED) throw new BadRequestException('Bulletin is not published');

    // Check if user is Admin or has Publish/Approve permission
    const roles = await this.permissionsService.getUserRolesInDepartment(userId, bulletin.department_id);
    const isAdmin = roles.some(r => r.role_id === 'fallback-admin' || (r.role && r.role.code === 'ADMIN'));

    if (!isAdmin) {
      const canPublish = await this.permissionsService.checkPermission(userId, bulletin.department_id, 'PUBLISH_NEWS');
      const canApprove = await this.permissionsService.checkPermission(userId, bulletin.department_id, 'APPROVE_NEWS');
      if (!canPublish && !canApprove) {
        throw new ForbiddenException('Only Administrators or authorized users can unpublish');
      }
    }

    bulletin.status = BulletinStatus.APPROVED;
    await this.bulletinRepository.save(bulletin);
    await this.logHistory(id, userId, bulletin.current_step, BulletinAction.UNPUBLISHED, 'Unpublished (moved back to approved)');
    return bulletin;
  }

  async delete(id: string, userId: string) {
    const bulletin = await this.findOne(id);

    const roles = await this.permissionsService.getUserRolesInDepartment(userId, bulletin.department_id);
    let isAdmin = roles.some(r => r.role_id === 'fallback-admin' || (r.role && r.role.code === 'ADMIN') || (r.role && r.role.name && r.role.name.toLowerCase().includes('quản trị')));

    if (!isAdmin) {
      const canPublish = await this.permissionsService.checkPermission(userId, bulletin.department_id, 'PUBLISH_NEWS');
      const canApprove = await this.permissionsService.checkPermission(userId, bulletin.department_id, 'APPROVE_NEWS');
      if (canPublish || canApprove) isAdmin = true;
    }

    if (!isAdmin && bulletin.author_id !== userId) {
      throw new ForbiddenException('Only author or administrator can delete this bulletin');
    }

    await this.historyRepository.delete({ bulletin_id: id });
    await this.bulletinRepository.delete(id);
    
    return { success: true };
  }

  async increaseViewCount(id: string) {
    const bulletin = await this.findOne(id);
    bulletin.viewCount = Number(bulletin.viewCount || 0) + 1;
    await this.bulletinRepository.save(bulletin);
    return { id: bulletin.id, view_count: bulletin.viewCount };
  }

  private async checkWorkflowPermission(userId: string, workflow: DepartmentApprovalWorkflowEntity) {
    if (workflow.approver_type === ApproverType.BY_USER) {
      return workflow.approver_id === userId;
    } else {
      const userRoles = await this.permissionsService.getUserRolesInDepartment(userId, workflow.department_id);
      return userRoles.some(ur => ur.role_id === workflow.approver_id);
    }
  }

  private async logHistory(bulletinId: string, actorId: string, step: number, action: BulletinAction, comment?: string) {
    const history = this.historyRepository.create({
      bulletin_id: bulletinId,
      actor_id: actorId,
      step_order: step,
      action,
      comment
    });
    await this.historyRepository.save(history);
  }

  // Workflow Config
  async getWorkflows(departmentId: string) {
    const rows = await this.workflowRepository.find({
      where: { department_id: departmentId },
      order: { step_order: 'ASC' }
    });
    return rows.map((step) => this.normalizeWorkflowStep(step));
  }

  async updateWorkflow(departmentId: string, steps: Partial<DepartmentApprovalWorkflowEntity>[]) {
    await this.workflowRepository.delete({ department_id: departmentId });
    const entities = (Array.isArray(steps) ? steps : []).map((step, index) =>
      this.workflowRepository.create(this.normalizeWorkflowStep({
        department_id: departmentId,
        step_order: index + 1,
        ...step,
      })),
    );
    return this.workflowRepository.save(entities);
  }

  private normalizeWorkflowStep(step: Partial<DepartmentApprovalWorkflowEntity>) {
    return {
      ...step,
      step_name: step.step_name || null,
      sla_hours: typeof step.sla_hours === 'number' ? step.sla_hours : null,
      is_required: step.is_required !== false,
      min_approvals: Number(step.min_approvals || 1),
      can_auto_publish: !!step.can_auto_publish,
      publish_channel: step.publish_channel || null,
      notify_scope: step.notify_scope || null,
      on_reject_action: step.on_reject_action || 'RETURN_TO_DRAFT',
      is_active: step.is_active !== false,
      config_json: step.config_json || null,
    } as Partial<DepartmentApprovalWorkflowEntity>;
  }
}
