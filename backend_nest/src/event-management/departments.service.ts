import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDepartmentDto } from './dto/departments/query-department.dto';
import { OrganizationUnitEntity } from '../organization-unit/organization-unit_sql/organization-unit.entity';
import { UserEntity } from '../users/entities/user.entity';
import { STATUS } from '../variables/CONST_STATUS';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(OrganizationUnitEntity, 'mssqlConnection')
    private readonly orgRepo: Repository<OrganizationUnitEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(query: QueryDepartmentDto) {
    const page = Math.max(Number(query.page ?? 0), 0);
    const size = Math.max(Number(query.size ?? 20), 1);
    const keyword = String(query.keyword || '').trim();

    const qb = this.orgRepo
      .createQueryBuilder('org')
      .where('org.status = :status', { status: STATUS.ACTIVED });

    if (keyword) {
      qb.andWhere(
        '(org.name COLLATE Latin1_General_CI_AI LIKE :kw COLLATE Latin1_General_CI_AI OR org.code COLLATE Latin1_General_CI_AI LIKE :kw COLLATE Latin1_General_CI_AI)',
        { kw: `%${keyword}%` },
      );
    }

    qb.orderBy('org.name', 'ASC').skip(page * size).take(size);

    const [items, total] = await qb.getManyAndCount();
    const ids = items.map((item) => item.id);

    let memberCountMap = new Map<string, number>();
    if (ids.length) {
      const memberRows = await this.userRepo
        .createQueryBuilder('u')
        .select('u.parent', 'departmentId')
        .addSelect('COUNT(1)', 'memberCount')
        .where('u.parent IN (:...ids)', { ids })
        .andWhere('u.status = :status', { status: STATUS.ACTIVED })
        .groupBy('u.parent')
        .getRawMany<{ departmentId: string; memberCount: string }>();

      memberCountMap = new Map(
        memberRows.map((row) => [row.departmentId, Number(row.memberCount || 0)]),
      );
    }

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        parentId: item.parentId,
        memberCount: memberCountMap.get(item.id) || 0,
      })),
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  async findOne(departmentId: string) {
    const item = await this.orgRepo.findOne({
      where: { id: departmentId, status: STATUS.ACTIVED },
    });

    if (!item) {
      return { success: true, data: null };
    }

    const memberCount = await this.userRepo
      .createQueryBuilder('u')
      .where('u.parent = :departmentId', { departmentId })
      .andWhere('u.status = :status', { status: STATUS.ACTIVED })
      .getCount();

    return {
      success: true,
      data: {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        parentId: item.parentId,
        memberCount,
      },
    };
  }
}
