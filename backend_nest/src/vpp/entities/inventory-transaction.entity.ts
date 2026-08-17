import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';

@Entity('InventoryTransaction')
export class InventoryTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  transaction_code: string;

  @Column({ length: 20 })
  transaction_type: string; // RECEIPT, ISSUE

  @Column({ length: 30, default: 'draft' })
  status: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @Column({ name: 'created_by' })
  createdById: string;

  @Column({ type: 'datetime', default: () => 'GETDATE()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  @OneToMany(() => InventoryTransactionItemEntity, (item) => item.transaction)
  items: InventoryTransactionItemEntity[];
}

@Entity('InventoryTransaction_Item')
export class InventoryTransactionItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InventoryTransactionEntity, (t) => t.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: InventoryTransactionEntity;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  requested_quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  actual_quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  unit_price: number;

  @Column({ length: 500, nullable: true })
  note: string;
}

@Entity('InventoryTransaction_Log')
export class InventoryTransactionLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ length: 30 })
  action_type: string; // SUBMIT, APPROVE, REJECT, CANCEL, etc.

  @Column({ length: 30 })
  status: string;

  @Column({ length: 500, nullable: true })
  note: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'approval_id', nullable: true })
  approvalId: string;

  @Column({ length: 50, nullable: true })
  ip: string;

  @Column({ length: 255, nullable: true })
  resource: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
