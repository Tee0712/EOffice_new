import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

export enum ChannelType {
  EMAIL = 'email',
  ZALO_OA = 'zalo_oa',
  SMS = 'sms',
  INAPP = 'inapp',
}

export enum ChannelStatus {
  CONNECTED = 'connected',
  ERROR = 'error',
  LOW_CREDIT = 'low_credit',
}

@Entity('mm_notification_channels')
export class NotificationChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 20 })
  @Index()
  type: ChannelType;

  @Column({ type: 'nvarchar', length: 255 })
  label: string;

  // JSON: host, token, gateway, etc.
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  config: string | null;

  @Column({ type: 'nvarchar', length: 20, default: ChannelStatus.CONNECTED })
  status: ChannelStatus;

  @Column({ type: 'bit', default: 1, name: 'is_enabled' })
  isEnabled: boolean;
}
