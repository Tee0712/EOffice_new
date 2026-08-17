import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulletinRoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { DepartmentRolePermissionEntity } from './entities/department-role-permission.entity';
import { UserDepartmentRoleEntity } from './entities/user-department-role.entity';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly fallbackRoles = [
    { id: 'fallback-admin', code: 'ADMIN', name: 'Quản trị viên' },
    { id: 'fallback-reviewer', code: 'REVIEWER', name: 'Phê duyệt viên' },
    { id: 'fallback-editor', code: 'EDITOR', name: 'Biên tập viên' },
    { id: 'fallback-contributor', code: 'CONTRIBUTOR', name: 'Tác viên' },
    { id: 'fallback-viewer', code: 'VIEWER', name: 'Người xem' },
  ];
  private readonly fallbackPermissions = [
    { id: 'fallback-create-news', code: 'CREATE_NEWS', name: 'Tạo bản tin' },
    { id: 'fallback-edit-news', code: 'EDIT_NEWS', name: 'Chỉnh sửa bản tin' },
    { id: 'fallback-approve-news', code: 'APPROVE_NEWS', name: 'Phê duyệt bản tin' },
    { id: 'fallback-publish-news', code: 'PUBLISH_NEWS', name: 'Đăng tải bản tin' },
    { id: 'fallback-view-news', code: 'VIEW_NEWS', name: 'Xem bản tin' },
    { id: 'fallback-manage-members', code: 'MANAGE_MEMBERS', name: 'Quản lý thành viên' },
  ];

  constructor(
    @InjectRepository(BulletinRoleEntity, 'mssqlConnection')
    private roleRepository: Repository<BulletinRoleEntity>,
    @InjectRepository(PermissionEntity, 'mssqlConnection')
    private permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(DepartmentRolePermissionEntity, 'mssqlConnection')
    private matrixRepository: Repository<DepartmentRolePermissionEntity>,
    @InjectRepository(UserDepartmentRoleEntity, 'mssqlConnection')
    private userDeptRoleRepository: Repository<UserDepartmentRoleEntity>,
  ) { }

  async onModuleInit() {
    await this.ensureBulletinTables();
  }

  private async ensureBulletinTables() {
    try {
      await this.userDeptRoleRepository.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[bulletin_roles]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[bulletin_roles] (
            [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
            [code] nvarchar(100) NOT NULL,
            [name] nvarchar(255) NOT NULL,
            CONSTRAINT [PK_bulletin_roles] PRIMARY KEY ([id]),
            CONSTRAINT [UQ_bulletin_roles_code] UNIQUE ([code])
          )
        END
      `);

      await this.userDeptRoleRepository.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[permissions]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[permissions] (
            [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
            [code] nvarchar(100) NOT NULL,
            [name] nvarchar(255) NOT NULL,
            CONSTRAINT [PK_permissions] PRIMARY KEY ([id]),
            CONSTRAINT [UQ_permissions_code] UNIQUE ([code])
          )
        END
      `);

      await this.userDeptRoleRepository.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[department_role_permissions]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[department_role_permissions] (
            [department_id] uniqueidentifier NOT NULL,
            [role_id] uniqueidentifier NOT NULL,
            [permission_id] uniqueidentifier NOT NULL,
            CONSTRAINT [PK_department_role_permissions] PRIMARY KEY ([department_id], [role_id], [permission_id])
          )
        END
      `);

      await this.userDeptRoleRepository.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_department_roles]') AND type in (N'U'))
        BEGIN
          CREATE TABLE [dbo].[user_department_roles] (
            [id] uniqueidentifier NOT NULL DEFAULT NEWID(),
            [user_id] nvarchar(100) NOT NULL,
            [department_id] uniqueidentifier NOT NULL,
            [role_id] uniqueidentifier NOT NULL,
            [joined_at] datetime NOT NULL DEFAULT GETDATE(),
            CONSTRAINT [PK_user_department_roles] PRIMARY KEY ([id]),
            CONSTRAINT [UQ_user_department_role] UNIQUE ([user_id], [department_id])
          )
        END
      `);

      await this.userDeptRoleRepository.query(`
        INSERT INTO [dbo].[bulletin_roles] ([code], [name])
        SELECT v.code, v.name
        FROM (VALUES
          ('ADMIN', N'Quản trị viên'),
          ('REVIEWER', N'Phê duyệt viên'),
          ('EDITOR', N'Biên tập viên'),
          ('CONTRIBUTOR', N'Tác viên'),
          ('VIEWER', N'Người xem')
        ) AS v(code, name)
        WHERE NOT EXISTS (
          SELECT 1 FROM [dbo].[bulletin_roles] r WHERE r.code = v.code
        )
      `);

      await this.userDeptRoleRepository.query(`
        INSERT INTO [dbo].[permissions] ([code], [name])
        SELECT v.code, v.name
        FROM (VALUES
          ('CREATE_NEWS', N'Tạo bản tin'),
          ('EDIT_NEWS', N'Chỉnh sửa bản tin'),
          ('APPROVE_NEWS', N'Phê duyệt bản tin'),
          ('PUBLISH_NEWS', N'Đăng tải bản tin'),
          ('VIEW_NEWS', N'Xem bản tin'),
          ('MANAGE_MEMBERS', N'Quản lý thành viên')
        ) AS v(code, name)
        WHERE NOT EXISTS (
          SELECT 1 FROM [dbo].[permissions] p WHERE p.code = v.code
        )
      `);
    } catch (error) {
      this.logger.error('Failed to initialize bulletin tables', error?.stack || error);
    }
  }

  async findAllRoles() {
    try {
      return await this.roleRepository.find();
    } catch (error) {
      this.logger.warn(`findAllRoles fallback: ${error?.message || error}`);
      return this.fallbackRoles;
    }
  }

  async createRole(payload: Partial<BulletinRoleEntity>) {
    try {
      const role = this.roleRepository.create(payload);
      return await this.roleRepository.save(role);
    } catch (error) {
      this.logger.error(`createRole failed: ${error?.message || error}`);
      throw new BadRequestException('Không thể tạo vai trò. Vui lòng kiểm tra cấu trúc bảng bulletin_roles.');
    }
  }

  async findAllPermissions() {
    try {
      return await this.permissionRepository.find();
    } catch (error) {
      this.logger.warn(`findAllPermissions fallback: ${error?.message || error}`);
      return this.fallbackPermissions;
    }
  }

  async getMatrix(departmentId: string) {
    try {
      return await this.matrixRepository.find({
        where: { department_id: departmentId },
        relations: ['role', 'permission'],
      });
    } catch (error) {
      this.logger.warn(`getMatrix fallback for department ${departmentId}: ${error?.message || error}`);
      return [];
    }
  }

  async updateMatrix(departmentId: string, payload: { role_id: string; permission_id: string }[]) {
    try {
      const uniqueMap = new Map<string, { role_id: string; permission_id: string }>();
      (Array.isArray(payload) ? payload : []).forEach((item) => {
        if (!item?.role_id || !item?.permission_id) return;
        const key = `${item.role_id}|${item.permission_id}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, item);
      });
      const uniquePayload = Array.from(uniqueMap.values());

      await this.matrixRepository.delete({ department_id: departmentId });
      const entities = uniquePayload.map((item) =>
        this.matrixRepository.create({ department_id: departmentId, ...item }),
      );
      if (!entities.length) return [];
      return await this.matrixRepository.save(entities);
    } catch (error) {
      this.logger.error(`updateMatrix failed for department ${departmentId}: ${error?.message || error}`);
      throw new BadRequestException('Không thể cập nhật ma trận quyền. Vui lòng kiểm tra bảng department_role_permissions.');
    }
  }

  async getMembers(departmentId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await this.userDeptRoleRepository.findAndCount({
        where: { department_id: departmentId },
        relations: ['user', 'role'],
        skip,
        take: limit,
        order: { joinedAt: 'DESC' }
      });

      // Get bulletin_count for each member in this department
      const itemsWithCount = await Promise.all(items.map(async (item) => {
        const count = await this.userDeptRoleRepository.query(
          `SELECT COUNT(1) as count FROM bulletins b 
           WHERE b.author_id = @0 AND b.department_id = @1`,
          [item.user_id, item.department_id]
        );
        return {
          ...item,
          bulletin_count: Number(count[0]?.count || 0)
        };
      }));

      return { items: itemsWithCount, total };
    } catch (error) {
      this.logger.error(`getMembers failed for department ${departmentId}: ${error?.message || error}`);
      return { items: [], total: 0 };
    }
  }

  async addMember(departmentId: string, userId: string, roleId: string) {
    try {
      const existing = await this.userDeptRoleRepository.findOne({
        where: { department_id: departmentId, user_id: userId },
      });
      if (existing) throw new BadRequestException('User already in this department');

      const member = this.userDeptRoleRepository.create({
        department_id: departmentId,
        user_id: userId,
        role_id: roleId,
      });
      return await this.userDeptRoleRepository.save(member);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`addMember failed for user ${userId}: ${error?.message || error}`);
      throw new BadRequestException('Không thể thêm thành viên. Vui lòng kiểm tra bảng user_department_roles.');
    }
  }

  async updateMemberRole(departmentId: string, userId: string, roleId: string) {
    try {
      const member = await this.userDeptRoleRepository.findOne({
        where: { department_id: departmentId, user_id: userId },
      });
      if (!member) throw new BadRequestException('Member not found');
      member.role_id = roleId;
      return await this.userDeptRoleRepository.save(member);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`updateMemberRole failed for user ${userId}: ${error?.message || error}`);
      throw new BadRequestException('Không thể cập nhật vai trò thành viên.');
    }
  }

  async removeMember(departmentId: string, userId: string) {
    try {
      return await this.userDeptRoleRepository.delete({
        department_id: departmentId,
        user_id: userId,
      });
    } catch (error) {
      this.logger.error(`removeMember failed for user ${userId}: ${error?.message || error}`);
      throw new BadRequestException('Không thể xóa thành viên.');
    }
  }

  // Helper for Workflow
  async checkPermission(userId: string, departmentId: string, permissionCode: string) {
    const userRole = await this.userDeptRoleRepository.findOne({
      where: { user_id: userId, department_id: departmentId },
    });
    if (!userRole) return false;

    const permission = await this.permissionRepository.findOne({ where: { code: permissionCode } });
    if (!permission) return false;

    const matrix = await this.matrixRepository.findOne({
      where: { department_id: departmentId, role_id: userRole.role_id, permission_id: permission.id },
    });
    return !!matrix;
  }

  async getUserRolesInDepartment(userId: string, departmentId?: string) {
    const where: any = { user_id: userId };
    if (departmentId) where.department_id = departmentId;
    return this.userDeptRoleRepository.find({ where });
  }
}
