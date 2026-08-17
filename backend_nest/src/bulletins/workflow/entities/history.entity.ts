import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BulletinEntity } from './bulletin.entity';
import { UserEntity } from '../../../users/entities/user.entity';

export enum BulletinAction {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUEST_EDIT = 'REQUEST_EDIT',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
}

@Entity('bulletin_approval_histories')
export class BulletinApprovalHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bulletin_id' })
  bulletin_id: string;

  @Column({ type: 'int', name: 'step_order' })
  step_order: number;

  @Column({ type: 'nvarchar', length: 100, name: 'actor_id' })
  actor_id: string;

  @Column({
    type: 'nvarchar',
    length: 50,
    enum: BulletinAction
  })
  action: BulletinAction;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  comment: string | null;

  @ManyToOne(() => BulletinEntity, (bulletin) => bulletin.histories)
  @JoinColumn({ name: 'bulletin_id' })
  bulletin: BulletinEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'actor_id' })
  actor: UserEntity;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;
}
