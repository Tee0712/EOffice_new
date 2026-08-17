import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from '../../../users/entities/user.entity';
import { BulletinDepartmentEntity } from '../../departments/entities/department.entity';
import { BulletinApprovalHistoryEntity } from './history.entity';

export enum BulletinStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  REQUIRE_EDIT = 'REQUIRE_EDIT',
}

export enum BulletinType {
  NEWS = 'NEWS',
  NOTICE = 'NOTICE',
  REPORT = 'REPORT',
  EVENT = 'EVENT',
  SAFETY = 'SAFETY',
}

export enum BulletinPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('bulletins')
export class BulletinEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 500 })
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    name: 'bulletin_type',
    default: BulletinType.NEWS,
  })
  bulletinType: BulletinType;

  @Column({
    type: 'nvarchar',
    length: 20,
    default: BulletinPriority.NORMAL,
  })
  priority: BulletinPriority;

  @Column()
  department_id: string;

  @Column({ type: 'nvarchar', length: 100 })
  author_id: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    enum: BulletinStatus,
    default: BulletinStatus.DRAFT
  })
  status: BulletinStatus;

  @Column({ type: 'int', default: 1, name: 'current_step' })
  current_step: number;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  tags: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  attachments: string;

  @Column({ type: 'datetime', nullable: true, name: 'scheduled_publish_at' })
  scheduledPublishAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'scheduled_unpublish_at' })
  scheduledUnpublishAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @ManyToOne(() => BulletinDepartmentEntity)
  @JoinColumn({ name: 'department_id' })
  department: BulletinDepartmentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @OneToMany(() => BulletinApprovalHistoryEntity, (history) => history.bulletin)
  histories: BulletinApprovalHistoryEntity[];

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, name: 'viewer_department_ids' })
  viewerDepartmentIds: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
