import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../../config'
import { TOrderListEntity } from './TOrderList.entity'
import { TOrderListService } from './TOrderList.service'

const entities = [
  TOrderListEntity
]

const services = [
  TOrderListService
]

@Module({
  imports: [
    TypeOrmModule.forFeature(entities, config.mysqlOptions.name),
  ],
  providers: services,
  controllers: [],
  exports: services,
})

export class TOrderListModule {
}
