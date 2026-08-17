import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notifycation/notification.module';

// Entities
import { EventEntity } from './entities/event.entity';
import { EventProgramEntity } from './entities/event-program.entity';
import { EventAttachmentEntity } from './entities/event-attachment.entity';
import { EventNotificationEntity } from './entities/event-notification.entity';
import { NotificationRecipientEntity } from './entities/notification-recipient.entity';
import { NotificationConfirmationEntity } from './entities/notification-confirmation.entity';
import { EventGuestEntity } from './entities/event-guest.entity';
import { GuestRegistrationEntity } from './entities/guest-registration.entity';
import { EventLogisticsEntity } from './entities/event-logistics.entity';
import { EventHotelEntity } from './entities/event-hotel.entity';
import { EventTransportEntity } from './entities/event-transport.entity';
import { EventCateringEntity } from './entities/event-catering.entity';
import { ReminderLogEntity } from './entities/reminder-log.entity';
import { EventSatisfactionSurveyEntity } from './entities/event-satisfaction-survey.entity';
import { EventSatisfactionResponseEntity } from './entities/event-satisfaction-response.entity';
import { OrganizationUnitEntity } from '../organization-unit/organization-unit_sql/organization-unit.entity';
import { UserEntity } from '../users/entities/user.entity';

// Services
import { EventsService } from './events.service';
import { NotificationsService } from './notifications.service';
import { ConfirmationsService } from './confirmations.service';
import { GuestsService } from './guests.service';
import { LogisticsService } from './logistics.service';
import { DepartmentsService } from './departments.service';

// Controllers
import { EventsController } from './events.controller';
import { NotificationsController } from './notifications.controller';
import { RecipientsController } from './recipients.controller';
import { GuestsController } from './guests.controller';
import { LogisticsController } from './logistics.controller';
import { DepartmentsController } from './departments.controller';

const ENTITIES = [
  EventEntity,
  EventProgramEntity,
  EventAttachmentEntity,
  EventNotificationEntity,
  NotificationRecipientEntity,
  NotificationConfirmationEntity,
  EventGuestEntity,
  GuestRegistrationEntity,
  EventLogisticsEntity,
  EventHotelEntity,
  EventTransportEntity,
  EventCateringEntity,
  ReminderLogEntity,
  EventSatisfactionSurveyEntity,
  EventSatisfactionResponseEntity,
  OrganizationUnitEntity,
  UserEntity,
];

@Module({
  imports: [
    TypeOrmModule.forFeature(ENTITIES, 'mssqlConnection'),
    forwardRef(() => NotificationModule),
  ],
  providers: [
    EventsService,
    NotificationsService,
    ConfirmationsService,
    GuestsService,
    LogisticsService,
    DepartmentsService,
  ],
  controllers: [
    EventsController,
    NotificationsController,
    RecipientsController,
    GuestsController,
    LogisticsController,
    DepartmentsController,
  ],
  exports: [EventsService, GuestsService],
})
export class EventManagementModule {}
