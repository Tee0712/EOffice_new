import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('canteen_user_settings')
export class CanteenUserSettingEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'nvarchar', length: 100 })
  userId: string;

  @Column({ name: 'auto_cancel_on_trip', type: 'bit', default: true })
  autoCancelOnTrip: boolean;

  @Column({ name: 'auto_cancel_on_leave', type: 'bit', default: true })
  autoCancelOnLeave: boolean;

  @Column({ name: 'receive_email_notification', type: 'bit', default: true })
  receiveEmailNotification: boolean;

  @Column({ name: 'remind_before_1_day', type: 'bit', default: false })
  remindBefore1Day: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
