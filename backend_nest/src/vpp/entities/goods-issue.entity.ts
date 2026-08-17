import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { InventoryTransactionEntity } from './inventory-transaction.entity';
import { UserEntity } from 'src/users/entities/user.entity';

@Entity('GoodsIssue')
export class GoodsIssueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => InventoryTransactionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: InventoryTransactionEntity;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'receiver_id', nullable: true })
  receiver_id: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserEntity;

  @Column({ length: 20, default: 'normal' })
  priority: string;

  @Column({ type: 'date', nullable: true })
  needed_date: Date;

  @Column({ length: 500, nullable: true })
  signature: string;

  @Column({ length: 500, nullable: true })
  reason: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ nullable: true })
  status: number;

  @Column({ length: 255, nullable: true })
  approver: string;

  @Column({ name: 'requester_name', length: 255, nullable: true })
  requester_name: string;

  @Column({ name: 'requester_username', length: 255, nullable: true })
  requester_username: string;

  @Column({ name: 'requester_id', length: 255, nullable: true })
  requester_id: string;

  /** ID người phê duyệt cuối (Trưởng phòng duyệt) */
  @Column({ name: 'reviewer_id', length: 255, nullable: true })
  reviewer_id: string;

  /** ID người từ chối */
  @Column({ name: 'reject_id', length: 255, nullable: true })
  reject_id: string;
}
