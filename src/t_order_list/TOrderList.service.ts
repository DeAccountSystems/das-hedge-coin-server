import { createBasicService } from '../basic/basic.service'
import config from '../../config'
import { TOrderListEntity } from './TOrderList.entity'

export class TOrderListService extends createBasicService<TOrderListEntity>(TOrderListEntity, config.mysqlOptions.name) {
}
