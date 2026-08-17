import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('meal_system_settings')
export class MealSystemSettingEntity {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'registration_deadline_time', type: 'varchar', length: 10, default: '16:00' })
  registrationDeadlineTime: string;

  @Column({ name: 'cancellation_deadline_time', type: 'varchar', length: 10, default: '10:00' })
  cancellationDeadlineTime: string;

  @Column({ name: 'allow_multi_meal', type: 'bit', default: true })
  allowMultiMeal: boolean;

  @Column({ name: 'allow_bulk_registration', type: 'bit', default: true })
  allowBulkRegistration: boolean;

  @Column({ name: 'auto_cancel_on_business_trip', type: 'bit', default: true })
  autoCancelOnBusinessTrip: boolean;

  @Column({ name: 'auto_cancel_on_leave', type: 'bit', default: true })
  autoCancelOnLeave: boolean;

  @Column({ name: 'require_cancel_reason', type: 'bit', default: false })
  requireCancelReason: boolean;

  @Column({ name: 'weekend_service', type: 'bit', default: false })
  weekendService: boolean;

  @Column({ name: 'refund_rate_on_time', type: 'decimal', precision: 5, scale: 2, default: 100 })
  refundRateOnTime: number;

  @Column({ name: 'refund_rate_late', type: 'decimal', precision: 5, scale: 2, default: 0 })
  refundRateLate: number;

  @Column({ name: 'updated_by', type: 'nvarchar', length: 100, nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
