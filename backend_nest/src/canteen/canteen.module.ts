import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Legacy & Base Entities ──
import { CanteenController } from './canteen.controller';
import { CanteenService } from './canteen.service';
import { DishEntity } from './entities/dish.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { MenuEntity } from './entities/menu.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { MenuTemplateEntity } from './entities/menu-template.entity';
import { MenuTemplateItemEntity } from './entities/menu-template-item.entity';
import { MealRegistrationEntity } from './entities/meal-registration.entity';
import { LeaveBusinessRecordEntity } from './entities/leave-business-record.entity';
import { SystemSettingEntity } from './entities/system-setting.entity';
import { MealCheckinEntity } from './entities/meal-checkin.entity';
import { MealActualServingEntity } from './entities/meal-actual-serving.entity';
import { SupplierContractEntity } from './entities/supplier-contract.entity';
import { SupplierOrderEntity } from './entities/supplier-order.entity';
import { SupplierEvaluationEntity } from './entities/supplier-evaluation.entity';
import { SupplierEvaluationScoreEntity } from './entities/supplier-evaluation-score.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { MealEvaluationEntity } from './entities/meal-evaluation.entity';

// ── SRS doc159 Entities ──
import { MealSessionEntity } from './entities/meal-session.entity';
import { DailyMenuEntity } from './entities/daily-menu.entity';
import { CanteenRegistrationEntity } from './entities/canteen-registration.entity';
import { RegistrationItemEntity } from './entities/registration-item.entity';
import { RegistrationHistoryEntity } from './entities/registration-history.entity';
import { MealTemplateEntity } from './entities/meal-template.entity';
import { CanteenSystemSettingEntity } from './entities/canteen-system-setting.entity';
import { CanteenUserSettingEntity } from './entities/canteen-user-setting.entity';

// ── External Modules & Entities ──
import { SystemLogSqlModule } from '../systemLogManagement/system-log.module';
import { NotificationModule } from '../notifycation/notification.module';
import { UserEntity } from '../users/entities/user.entity';
import { GroupUserEntity } from '../group-users/entities/group-users.entity';
import { ListRoleEntity } from '../list-role/entities/list-role.entity';

// ── Services & Controllers ──
import { CanteenRegistrationService } from './service/canteen-registration.service';
import { CanteenAdminService } from './service/canteen-admin.service';
import { CanteenRegistrationController } from './controller/canteen-registration.controller';
import { CanteenAdminController } from './controller/canteen-admin.controller';
import { CanteenCheckinController } from './controller/canteen-checkin.controller';
import { CanteenCheckinService } from './service/canteen-checkin.service';

@Module({
  imports: [
    SystemLogSqlModule,
    NotificationModule,
    TypeOrmModule.forFeature(
      [
        // Core & SRS Entities
        DishEntity,
        SupplierEntity,
        MenuEntity,
        MenuItemEntity,
        MenuTemplateEntity,
        MenuTemplateItemEntity,
        MealRegistrationEntity,
        LeaveBusinessRecordEntity,
        SystemSettingEntity,
        MealCheckinEntity,
        MealActualServingEntity,
        SupplierContractEntity,
        SupplierOrderEntity,
        SupplierEvaluationEntity,
        SupplierEvaluationScoreEntity,
        AuditLogEntity,
        MealEvaluationEntity,
        MealSessionEntity,
        DailyMenuEntity,
        CanteenRegistrationEntity,
        RegistrationItemEntity,
        RegistrationHistoryEntity,
        MealTemplateEntity,
        CanteenSystemSettingEntity,
        CanteenUserSettingEntity,
        UserEntity,
        GroupUserEntity,
        ListRoleEntity,
      ],
      'mssqlConnection',
    ),
  ],
  controllers: [
    CanteenController,
    CanteenRegistrationController,
    CanteenAdminController,
    CanteenCheckinController,
  ],
  providers: [
    CanteenService,
    CanteenRegistrationService,
    CanteenAdminService,
    CanteenCheckinService,
  ],
  exports: [
    CanteenService,
    CanteenRegistrationService,
    CanteenAdminService,
    CanteenCheckinService,
  ],
})
export class CanteenModule {}
