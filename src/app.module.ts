import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { TOrderListModule } from './t_order_list/TOrderList.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../config'
import { TOrderListEntity } from './t_order_list/TOrderList.entity'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...config.mysqlOptions,
      entities: [
        TOrderListEntity
      ],
      synchronize: false
    }),
    TOrderListModule
  ],
  controllers: [
    AppController
  ],
  providers: [
  ]
})

export class ApplicationModule {}
