import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { BulletinRoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { DepartmentRolePermissionEntity } from './entities/department-role-permission.entity';
import { UserDepartmentRoleEntity } from './entities/user-department-role.entity';

import { SystemLogSqlModule } from 'src/systemLogManagement/system-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BulletinRoleEntity,
      PermissionEntity,
      DepartmentRolePermissionEntity,
      UserDepartmentRoleEntity,
    ], 'mssqlConnection'),
    SystemLogSqlModule,
  ],
  providers: [PermissionsService],
  controllers: [PermissionsController],
  exports: [PermissionsService],
})
export class PermissionsModule {}
