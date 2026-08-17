import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from './entities/program.entity';
import { ProgramItemEntity } from './entities/program-item.entity';
import { ProgramMilestoneEntity } from './entities/program-milestone.entity';
import { ProgramMemberEntity } from './entities/program-member.entity';
import { ProgramAttachmentEntity } from './entities/program-attachment.entity';
import { ProgramDocumentEntity } from './entities/program-document.entity';
import { Department2Entity } from './entities/department2.entity';
import { DisbursementEntity } from './entities/disbursement.entity';
import { DisbursementAttachmentEntity } from './entities/disbursement-attachment.entity';
import { DisbursementDetailEntity } from './entities/disbursement-detail.entity';
import { DisbursementLogEntity } from './entities/disbursement-log.entity';
import { DisbursementReceiverEntity } from './entities/disbursement-receiver.entity';
import { ProgramDisbursementSequenceEntity } from './entities/program-disbursement-sequence.entity';
import { UniversityPartnerEntity } from './entities/university-partner.entity';
import { UniversityPartnerQuotaEntity } from './entities/university-partner-quota.entity';
import { UniversityPartnerContactEntity } from './entities/university-partner-contact.entity';
import { UniversityPartnerAttachmentEntity } from './entities/university-partner-attachment.entity';
import { ScholarshipCandidateEntity } from './entities/scholarship-candidate.entity';
import { ScholarshipCandidateResultEntity } from './entities/scholarship-candidate-result.entity';
import { ScholarshipCandidateAttachmentEntity } from './entities/scholarship-candidate-attachment.entity';
import { ScholarshipCandidateSequenceEntity } from './entities/scholarship-candidate-sequence.entity';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowWizardService } from './service/workflow-wizard.service';
import { BpmnDesignEntity } from 'src/bpmn-designs/bpmn-design.entity';
import { RoleFeatureEntity } from 'src/role-feature/role-feature-sql/role-feature.entity';
import { RoleFeatureSqlModule } from 'src/role-feature/role-feature-sql/role-feature-sql.module';
import { WorkflowWizardController } from './controller/workflow-wizard.controller';
import { AsxhService } from './service/asxh.service';
import { AsxhInKindService } from './service/asxh-in-kind.service'; // NEW
import { ProgramsService } from './service/programs.service';
import { ProgramAttachmentsService } from './service/program-attachments.service';
import { LocationsService } from './service/locations.service';
import { ProgramItemsService } from './service/program-items.service';
import { ProgramMilestonesService } from './service/program-milestones.service';
import { ProgramMembersService } from './service/program-members.service';
import { EducationScholarshipController } from './controller/education-scholarship.controller';
import { EducationScholarshipService } from './service/education-scholarship.service';
import { DashboardService } from './service/dashboard.service';
import { AsxhController } from './controller/asxh.controller';
import { AsxhInKindController } from './controller/asxh-in-kind.controller'; // NEW
import { ProgramsController } from './controller/programs.controller';
import { LocationsController } from './controller/locations.controller';
import { ProgramSubItemsController } from './controller/program-sub-items.controller';
import { Departments2Controller } from './controller/departments2.controller';

import { AssetEntity } from './entities/asset.entity'; // NEW
import { AssetSpecificationEntity } from './entities/asset-specification.entity'; // NEW
import { AssetAttachmentEntity } from './entities/asset-attachment.entity'; // NEW
import { HandoverAssetEntity } from './entities/handover-asset.entity';
import { HandoverAttendeeEntity } from './entities/handover-attendee.entity';
import { HandoverChecklistEntity } from './entities/handover-checklist.entity';
import { HandoverLogEntity } from './entities/handover-log.entity';
import { AsxhSupplierEntity } from './entities/asxh-supplier.entity';
import { ProgramAssetSequenceEntity } from './entities/program-asset-sequence.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { SystemLogSqlModule } from 'src/systemLogManagement/system-log.module';
import { DashboardController } from './controller/dashboard.controller';

// New Dynamic Workflow Mapping
import { ModuleWorkflowMappingEntity } from './entities/module-workflow-mapping.entity';
import { ModuleWorkflowConfigService } from './service/module-workflow-config.service';
import { ModuleWorkflowConfigController } from './controller/module-workflow-config.controller';
import { MenuManagerEntity } from '../menu-manager/entities/menu-manager.entity';
import { BpmnModule } from 'src/bpmn/bpmn.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramItemEntity,
      ProgramMilestoneEntity,
      ProgramMemberEntity,
      ProgramAttachmentEntity,
      Department2Entity,
      DisbursementEntity,
      DisbursementAttachmentEntity,
      DisbursementDetailEntity,
      DisbursementLogEntity,
      DisbursementReceiverEntity,
      ProgramDisbursementSequenceEntity,
      AssetEntity,
      AssetSpecificationEntity,
      AssetAttachmentEntity,
      HandoverAssetEntity,
      HandoverAttendeeEntity,
      HandoverChecklistEntity,
      HandoverLogEntity,
      AsxhSupplierEntity,
      ProgramAssetSequenceEntity,
      UniversityPartnerEntity,
      UniversityPartnerQuotaEntity,
      UniversityPartnerContactEntity,
      UniversityPartnerAttachmentEntity,
      ScholarshipCandidateEntity,
      ScholarshipCandidateResultEntity,
      ScholarshipCandidateAttachmentEntity,
      ScholarshipCandidateSequenceEntity,
      UserEntity,
      ProgramDocumentEntity,
      WorkflowEntity,
      BpmnDesignEntity,
      RoleFeatureEntity,
      ModuleWorkflowMappingEntity,
      MenuManagerEntity
    ], 'mssqlConnection'),
    SystemLogSqlModule,
    RoleFeatureSqlModule,
    BpmnModule,
  ],
  controllers: [
    AsxhController,
    AsxhInKindController,
    EducationScholarshipController,
    ProgramsController,
    LocationsController,
    ProgramSubItemsController,
    Departments2Controller,
    DashboardController,
    WorkflowWizardController,
    ModuleWorkflowConfigController,
  ],
  providers: [
    AsxhService,
    AsxhInKindService,
    EducationScholarshipService,
    ProgramsService,
    ProgramAttachmentsService,
    LocationsService,
    ProgramItemsService,
    ProgramMilestonesService,
    ProgramMembersService,
    DashboardService,
    WorkflowWizardService,
    ModuleWorkflowConfigService,
  ],
  exports: [AsxhService, ProgramsService, ModuleWorkflowConfigService],
})
export class AsxhModule { }
