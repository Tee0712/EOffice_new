import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryTransactionEntity } from './inventory-transaction.entity';

@Entity('GoodsReceipt')
export class GoodsReceiptEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => InventoryTransactionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: InventoryTransactionEntity;

  @Column({ name: 'transaction_id' })
  transactionId: number;

  @Column({ length: 200, nullable: true })
  supplier: string;

  @Column({ length: 100, nullable: true })
  invoice_number: string;

  @Column({ length: 500, nullable: true })
  note: string;
}
