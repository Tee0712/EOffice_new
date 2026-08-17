import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { STATUS } from 'src/variables/CONST_STATUS';
import { UserEntity } from 'src/users/entities/user.entity';
import { GroupUserEntity } from 'src/group-users/entities/group-users.entity';
import { ListRoleEntity } from 'src/list-role/entities/list-role.entity';

const ALLOWED_ROLE_KEYWORDS = [
  'quanly',
  'manager',
  'bangiamdoc',
  'giamdoc',
  'director',
  'canbo',
  'officer',
  'congty',
  'company',
  'admin',
  'bep',
  'canteen',
];

const DENIED_ROLE_KEYWORDS = ['nhanvien', 'employee', 'staff'];

const normalizeToken = (value: unknown): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

@Injectable()
export class CanteenEvaluationAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GroupUserEntity, 'mssqlConnection')
    private readonly groupUserRepo: Repository<GroupUserEntity>,
    @InjectRepository(ListRoleEntity, 'mssqlConnection')
    private readonly listRoleRepo: Repository<ListRoleEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.userId || request?.user?.user;

    if (!userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập thông tin đánh giá bữa ăn.');
    }

    const roleTokens = await this.resolveUserRoleTokens(userId);
    if (this.isAllowed(roleTokens)) {
      return true;
    }

    throw new ForbiddenException(
      'Chỉ cán bộ, quản lý, admin hoặc nhân viên bếp mới được xem chi tiết đánh giá bữa ăn.',
    );
  }

  private isAllowed(roleTokens: string[]): boolean {
    if (!roleTokens.length) return false;

    const hasAllowRole = roleTokens.some((token) =>
      ALLOWED_ROLE_KEYWORDS.some((allowed) => token.includes(allowed)),
    );
    if (hasAllowRole) return true;

    const hasDeniedRole = roleTokens.some((token) =>
      DENIED_ROLE_KEYWORDS.some((denied) => token.includes(denied)),
    );
    if (hasDeniedRole) return false;

    return false;
  }

  private async resolveUserRoleTokens(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role', 'rolesByProcess'],
      relations: ['groupUsers'],
    });

    if (!user) return [];

    const roleCandidates: string[] = [];

    if (user.role) {
      roleCandidates.push(user.role);
    }

    if (Array.isArray(user.rolesByProcess)) {
      user.rolesByProcess.forEach((processRole: any) => {
        const roles = Array.isArray(processRole?.roles) ? processRole.roles : [];
        roles.forEach((roleItem: any) => {
          if (roleItem?.roleCode) roleCandidates.push(roleItem.roleCode);
          if (roleItem?.name) roleCandidates.push(roleItem.name);
        });
      });
    }

    const userGroupIds = Array.isArray(user.groupUsers)
      ? user.groupUsers.map((g) => g.id).filter(Boolean)
      : [];

    if (userGroupIds.length > 0) {
      const groups = await this.groupUserRepo.find({
        where: { id: In(userGroupIds), status: STATUS.ACTIVED },
        select: ['roles'],
      });

      const roleIds = Array.from(
        new Set(
          groups.flatMap((group) =>
            Array.isArray(group.roles) ? group.roles : [],
          ),
        ),
      );

      if (roleIds.length > 0) {
        const staticRoles = await this.listRoleRepo.find({
          where: { id: In(roleIds), status: STATUS.ACTIVED },
          select: ['code', 'name'],
        });

        staticRoles.forEach((role) => {
          if (role.code) roleCandidates.push(role.code);
          if (role.name) roleCandidates.push(role.name);
        });
      }
    }

    return Array.from(
      new Set(roleCandidates.map(normalizeToken).filter(Boolean)),
    );
  }
}
