import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulletinWorkflowService } from './bulletin-workflow.service';
import { BulletinWorkflowController } from './bulletin-workflow.controller';
import { BulletinEntity } from './entities/bulletin.entity';
import { DepartmentApprovalWorkflowEntity } from './entities/workflow.entity';
import { BulletinApprovalHistoryEntity } from './entities/history.entity';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BulletinEntity,
      DepartmentApprovalWorkflowEntity,
      BulletinApprovalHistoryEntity,
    ], 'mssqlConnection'),
    PermissionsModule,
  ],
  providers: [BulletinWorkflowService],
  controllers: [BulletinWorkflowController],
  exports: [BulletinWorkflowService],
})
export class WorkflowModule {}
