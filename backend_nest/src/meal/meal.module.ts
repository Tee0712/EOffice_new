import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Legacy & Base Entities ──
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
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
import { MealBookingEntity } from './entities/meal-booking.entity';
import { RegistrationItemEntity } from './entities/registration-item.entity';
import { RegistrationHistoryEntity } from './entities/registration-history.entity';
import { MealTemplateEntity } from './entities/meal-template.entity';
import { MealSystemSettingEntity } from './entities/meal-system-setting.entity';
import { MealUserSettingEntity } from './entities/meal-user-setting.entity';
import { MealReconciliationEntity } from './entities/meal-reconciliation.entity';

// ── External Modules & Entities ──
import { SystemLogSqlModule } from '../systemLogManagement/system-log.module';
import { NotificationModule } from '../notifycation/notification.module';
import { UserEntity } from '../users/entities/user.entity';
import { GroupUserEntity } from '../group-users/entities/group-users.entity';
import { ListRoleEntity } from '../list-role/entities/list-role.entity';

// ── Services & Controllers ──
import { MealBookingService } from './service/meal-booking.service';
import { MealAdminService } from './service/meal-admin.service';
import { MealBookingController } from './controller/meal-booking.controller';
import { MealAdminController } from './controller/meal-admin.controller';
import { MealCheckinController } from './controller/meal-checkin.controller';
import { MealCheckinService } from './service/meal-checkin.service';

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
        MealBookingEntity,
        RegistrationItemEntity,
        RegistrationHistoryEntity,
        MealTemplateEntity,
        MealSystemSettingEntity,
        MealUserSettingEntity,
        MealReconciliationEntity,
        UserEntity,
        GroupUserEntity,
        ListRoleEntity,
      ],
      'mssqlConnection',
    ),
  ],
  controllers: [
    MealController,
    MealBookingController,
    MealAdminController,
    MealCheckinController,
  ],
  providers: [
    MealService,
    MealBookingService,
    MealAdminService,
    MealCheckinService,
  ],
  exports: [
    MealService,
    MealBookingService,
    MealAdminService,
    MealCheckinService,
  ],
})
export class MealModule {}
