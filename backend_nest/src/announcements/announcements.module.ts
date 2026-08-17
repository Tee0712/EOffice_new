import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementEntity } from './entities/announcement.entity';
import { AnnouncementTargetEntity } from './entities/announcement-target.entity';
import { AnnouncementAttachmentEntity } from './entities/announcement-attachment.entity';
import { AnnouncementReadStatusEntity } from './entities/announcement-read-status.entity';
import { BirthdayWishEntity } from './entities/birthday-wish.entity';
import { AnnouncementsService } from './announcements.service';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { UserInboxController } from './user-inbox.controller';
import { AttachmentsController } from './attachments.controller';
import { UserEntity } from '../users/entities/user.entity';
import { BirthdayService } from './birthday.service';
import { BirthdayController } from './birthday.controller';
import { MailModule } from '../mail/mail.module';
import { IncomingModule } from '../documents/incomming-document/incoming.module';
import { OutgoingDocumentsModule } from '../outgoing-documents/outgoing-documents.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MailModule,
    UsersModule,
    IncomingModule,
    OutgoingDocumentsModule,
    TypeOrmModule.forFeature([
      AnnouncementEntity,
      AnnouncementTargetEntity,
      AnnouncementAttachmentEntity,
      AnnouncementReadStatusEntity,
      BirthdayWishEntity,
      UserEntity,
    ], 'mssqlConnection'),
  ],
  providers: [AnnouncementsService, BirthdayService],
  controllers: [
    AdminAnnouncementsController,
    UserInboxController,
    AttachmentsController,
    BirthdayController,
  ],
  exports: [AnnouncementsService, BirthdayService],
})
export class AnnouncementsModule {}
