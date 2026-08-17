import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { PermissionsModule } from './permissions/permissions.module';
import { WorkflowModule } from './workflow/bulletin-workflow.module';

@Module({
  imports: [
    DepartmentsModule,
    PermissionsModule,
    WorkflowModule,
  ],
  exports: [
    DepartmentsModule,
    PermissionsModule,
    WorkflowModule,
  ],
})
export class BulletinsModule {}
