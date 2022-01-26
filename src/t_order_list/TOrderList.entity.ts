import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import config from '../../config'

@Entity(config.mysqlOptions.table.t_order_list)
export class TOrderListEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id',
    comment: 'primary key',
    unsigned: true,
  })
  id: string

  @Column('varchar', {
    name: 'order_id',
    unique: true,
    comment: 'order ID',
    length: 64,
  })
  orderId: string

  @Column('varchar', {
    name: 'pay_token_id',
    comment: 'payment token ID',
    length: 255,
  })
  payTokenId: string

  @Column('decimal', {
    name: 'pay_amount',
    comment: 'payment amount',
    precision: 60,
    scale: 18,
  })
  payAmount: string

  @Column('decimal', {
    name: 'to_usdt',
    nullable: true,
    comment: 'number of tokens converted to equivalent USDT',
    precision: 60,
    scale: 8,
  })
  toUsdt: string | null

  @Column('datetime', {
    name: 'to_usdt_at',
    nullable: true,
    comment: 'date of order conversion to USDT',
  })
  toUsdtAt: Date | null

  @Column('varchar', {
    name: 'to_usdt_order_id',
    nullable: true,
    comment: 'orders converted to USDT order ID',
    length: 255,
  })
  toUsdtOrderId: string | null

  @Column('decimal', {
    name: 'to_ckb',
    nullable: true,
    comment: 'number of tokens converted to equivalent CKB',
    precision: 60,
    scale: 8,
  })
  toCkb: string | null

  @Column('datetime', {
    name: 'to_ckb_at',
    nullable: true,
    comment: 'data of order conversion to CKB',
  })
  toCkbAt: Date | null

  @Column('varchar', {
    name: 'to_ckb_order_id',
    nullable: true,
    comment: 'order conversion to CKB order ID',
    length: 255,
  })
  toCkbOrderId: string | null

  @Column('datetime', { name: 'created_at', comment: 'order creation time' })
  createdAt: Date
}
