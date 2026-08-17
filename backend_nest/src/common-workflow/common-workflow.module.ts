import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonWorkflowEntity } from './entities/common-workflow.entity';
import { CommonWorkflowService } from './common-workflow.service';
import { CommonWorkflowController } from './common-workflow.controller';
import { AuthorityDocumentsModule } from 'src/authority-documents';
import { VppModule } from 'src/vpp/vpp.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommonWorkflowEntity], 'mssqlConnection'),
    AuthorityDocumentsModule,
    VppModule,
    UsersModule,
  ],
  controllers: [CommonWorkflowController],
  providers: [CommonWorkflowService],
  exports: [CommonWorkflowService],
})
export class CommonWorkflowModule {}
