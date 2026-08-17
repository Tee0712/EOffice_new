import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BulletinDepartmentEntity } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(BulletinDepartmentEntity, 'mssqlConnection')
    private departmentRepository: Repository<BulletinDepartmentEntity>,
  ) {}

  private normalizePayload(data: Partial<BulletinDepartmentEntity> & Record<string, any>) {
    return {
      name: data?.name,
      code: data?.code,
      description: data?.description,
      color: data?.color,
      isActive: typeof data?.isActive === 'boolean' ? data.isActive : data?.is_active,
      defaultPermissions:
        data?.defaultPermissions ??
        data?.default_permissions ??
        null,
    } as Partial<BulletinDepartmentEntity>;
  }

  async findAll() {
    const rows = await this.departmentRepository.query(`
      SELECT
        d.id,
        d.name,
        d.code,
        d.description,
        d.color,
        d.default_permissions,
        d.is_active,
        d.created_at,
        (
          SELECT COUNT(1) 
          FROM user_department_roles ur 
          WHERE ur.department_id = d.id
        ) as member_count,
        (
          SELECT COUNT(1) 
          FROM bulletins b 
          WHERE b.department_id = d.id
        ) as bulletin_count
      FROM bulletin_departments d
      ORDER BY d.created_at DESC
    `);

    if (Array.isArray(rows)) {
      return rows;
    }

    return this.departmentRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const dept = await this.departmentRepository.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async create(data: Partial<BulletinDepartmentEntity> & Record<string, any>) {
    const payload = this.normalizePayload(data);
    const dept = this.departmentRepository.create(payload);
    return this.departmentRepository.save(dept);
  }

  async updateStatus(id: string, isActive: boolean) {
    const dept = await this.findOne(id);
    dept.isActive = isActive;
    return this.departmentRepository.save(dept);
  }

  async update(id: string, data: Partial<BulletinDepartmentEntity> & Record<string, any>) {
    const dept = await this.findOne(id);
    const payload = this.normalizePayload(data);
    Object.assign(dept, payload);
    return this.departmentRepository.save(dept);
  }

  async remove(id: string) {
    await this.findOne(id);

    const usage = await this.departmentRepository.query(
      `
      DECLARE @bulletin_count INT = 0;
      DECLARE @member_count INT = 0;
      DECLARE @workflow_count INT = 0;

      IF OBJECT_ID(N'dbo.bulletins', N'U') IS NOT NULL
        SELECT @bulletin_count = COUNT(1) FROM dbo.bulletins WHERE department_id = @0;

      IF OBJECT_ID(N'dbo.user_department_roles', N'U') IS NOT NULL
        SELECT @member_count = COUNT(1) FROM dbo.user_department_roles WHERE department_id = @0;

      IF OBJECT_ID(N'dbo.department_approval_workflows', N'U') IS NOT NULL
        SELECT @workflow_count = COUNT(1) FROM dbo.department_approval_workflows WHERE department_id = @0;

      SELECT
        @bulletin_count AS bulletin_count,
        @member_count AS member_count,
        @workflow_count AS workflow_count;
      `,
      [id],
    );

    const info = Array.isArray(usage) && usage[0] ? usage[0] : {};
    const bulletinCount = Number(info?.bulletin_count || 0);
    const memberCount = Number(info?.member_count || 0);
    const workflowCount = Number(info?.workflow_count || 0);

    if (bulletinCount > 0 || memberCount > 0 || workflowCount > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng ban đang được sử dụng (bản tin: ${bulletinCount}, thành viên: ${memberCount}, quy trình: ${workflowCount}).`,
      );
    }

    await this.departmentRepository.delete({ id });
    return { success: true };
  }
}
