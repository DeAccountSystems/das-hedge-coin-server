import { Body, Controller, Get, Post } from '@nestjs/common'
import { In, Not } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import axios from './basic/axios'
import errno from './constants/errno'
import Decimal from 'decimal.js'
import { TOrderListService } from './t_order_list/TOrderList.service'
import { TOrderListEntity } from './t_order_list/TOrderList.entity'
import {
  CKB_TOKEN_ID,
  DAS_TOKEN_ID,
  FIAT_DECIMAL_PLACES,
  FiatCurrencyList,
  MIN_HEDGE_USDT,
  PayTokenIdToBinanceTradingPair,
  TOKEN_DECIMAL_PLACES,
  TokenBalanceEarlyWarningValue,
  TokenBalanceNotificationList
} from './constants'
import config from '../config'

@Controller()
export class AppController {
  constructor (
    private readonly tOrderListService: TOrderListService
  ) {}

  /**
   * calculate the number of legal tokens based on the filter LOT_SIZE order size
   * @param quantity token quantity
   * @param lotSize filter LOT_SIZE order size
   * @param baseAssetPrecision asset precision
   */
  calcQuantity (quantity: string, lotSize: any, baseAssetPrecision: number) {
    const multiple = new Decimal(quantity).sub(lotSize.minQty).div(lotSize.stepSize).toFixed(0)
    return new Decimal(multiple).times(lotSize.stepSize).add(lotSize.minQty).toFixed(baseAssetPrecision)
  }

  /**
   * get exchange rates for trading pairs
   * @param tradingPair trading pairs
   */
  async exchangeRate (tradingPair: string): Promise<string> {
    try {
      const { price }: any = await axios.get('/ticker/price', {
        params: {
          symbol: tradingPair
        }
      })
      return price
    }
    catch (err) {
      console.log('======exchangeRate=======')
      console.error(err)
      throw err
    }
  }

  /**
   * get the USDT rate for fiat currency
   * @param fiatCurrency fiat currency abbreviation
   */
  async usdtExchangeRate (fiatCurrency: string): Promise<number> {
    try {
      const { tether }: any = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=${fiatCurrency}`)
      return tether.cny
    }
    catch (err) {
      console.log('======usdtExchangeRate=======')
      console.error(err)
      throw err
    }
  }

  /**
   * trading specification information
   * @param tradingPair trading pairs
   */
  async tradingSpecificationInfo (tradingPair: string): Promise<any> {
    try {
      const res: any = await axios.get('/exchangeInfo', {
        params: {
          symbol: tradingPair
        }
      })
      return res
    }
    catch (err) {
      console.log('======tradingSpecificationInfo=======')
      console.error(err)
      throw err
    }
  }

  /**
   * submit order information
   * @param orderId DAS order ID
   * @param payTokenId DAS payment token ID
   * @param payAmount payment amount
   */
  @Post('/submit-order-info')
  async submitOrderInfo (@Body('orderId') orderId: string, @Body('payTokenId') payTokenId: string, @Body('payAmount') payAmount: string) {
    try {
      if (!orderId || !payTokenId || !payAmount) {
        const error: any = new Error('submitOrderInfo: param error')
        error.code = errno.paramError
        throw error
      }

      const res = await this.tOrderListService.insert({
        orderId,
        payTokenId,
        payAmount,
        createdAt: new Date()
      })

      if (res.raw?.insertId) {
        return {
          code: errno.success,
          message: ''
        }
      }
      else {
        return {
          code: errno.errorMysqlInsert,
          message: 'error mysql insert'
        }
      }
    }
    catch (err) {
      console.log('======submitOrderInfo=======')
      console.error(err)
      return {
        code: errno.errorMysqlInsert,
        message: err
      }
    }
  }

  /**
   * account balance
   */
  @Post('/token-balance')
  async tokenBalance () {
    try {
      const res: any = await axios.get('/account', {
        params: {},
        // @ts-ignore
        sign: true
      })
      let msg = {}
      res.balances.forEach((balance) => {
        if (balance.free > 0 && TokenBalanceNotificationList.includes(balance.asset)) {
          msg[balance.asset] = balance.free
        }
      })
      return {
        code: errno.success,
        message: msg
      }
    }
    catch (err) {
      console.log('======tokenBalance=======')
      console.error(err)
      return {
        code: errno.internalServerError,
        message: err
      }
    }
  }

  /**
   * complete the USDT in the order and do not make any exchange
   * @param group order groupings
   */
  async usdtToUsdt (group: TOrderListEntity[]) {
    try {
      for (const order of group) {
        await this.tOrderListService.updateOne(order.id, {
          toUsdt: order.payAmount,
          toUsdtOrderId: order.orderId,
          toUsdtAt: new Date()
        })
      }
    }
    catch (err) {
      console.log('======usdtToUsdt=======')
      console.error(err)
      throw err
    }
  }

  /**
   * fiat currency to USDT
   * @param group order groupings
   * @param fiatCurrency fiat currency abbreviation
   */
  async fiatCurrencyToUsdt (group: TOrderListEntity[], fiatCurrency: string) {
    console.log('=========fiatCurrencyToUsdt===========')
    console.log(group)
    console.log(fiatCurrency)
    console.log('====================')
    let totalAmount = new Decimal(0)

    try {
      const exchangeRate = await this.usdtExchangeRate(fiatCurrency)

      for (const order of group) {
        totalAmount = totalAmount.add(order.payAmount)
        const usdt = new Decimal(order.payAmount).div(exchangeRate).toFixed(TOKEN_DECIMAL_PLACES)
        await this.tOrderListService.updateOne(order.id, {
          toUsdt: usdt,
          toUsdtOrderId: order.orderId,
          toUsdtAt: new Date()
        })
      }
      void this.notification(`Fiat currency ${fiatCurrency}`, 'USDT', totalAmount.toFixed(FIAT_DECIMAL_PLACES))
    }
    catch (err) {
      console.log('======fiatCurrencyToUsdt=======')
      console.error(err)
      void this.notification(`Fiat currency ${fiatCurrency}`, 'USDT', totalAmount.toFixed(FIAT_DECIMAL_PLACES), true)
      throw err
    }
  }

  /**
   * token hedge for USDT
   * @param group order groupings
   * @param tradingPair trading pairs
   */
  async tokenToUsdt (group: TOrderListEntity[], tradingPair: string) {
    let totalAmount = new Decimal(0)

    try {
      for (const order of group) {
        totalAmount = totalAmount.add(order.payAmount)
      }

      const exchangeRate = await this.exchangeRate(tradingPair)
      const { symbols }: any = await this.tradingSpecificationInfo(tradingPair)
      const tradingPairInfo = symbols[0]
      const lotSize: any = tradingPairInfo.filters.find((item) => {
        return item.filterType === 'LOT_SIZE'
      })
      const usdt = totalAmount.times(exchangeRate)

      if (usdt.gte(MIN_HEDGE_USDT)) {
        const quantity = this.calcQuantity(totalAmount.toFixed(tradingPairInfo.baseAssetPrecision), lotSize, tradingPairInfo.baseAssetPrecision)
        if (!(new Decimal(quantity).gte(lotSize.minQty) && new Decimal(quantity).lte(lotSize.maxQty))) {
          return
        }
        const res: any = await axios.post('/order', null, {
          params: {
            symbol: tradingPair,
            side: 'SELL',
            type: 'MARKET',
            newOrderRespType: 'RESULT',
            quantity: quantity
          },
          // @ts-expect-error
          sign: true
        })

        if (res.orderId) {
          for (const order of group) {
            const usdt = new Decimal(order.payAmount).times(exchangeRate).toFixed(TOKEN_DECIMAL_PLACES)
            await this.tOrderListService.updateOne(order.id, {
              toUsdt: usdt,
              toUsdtOrderId: res.orderId,
              toUsdtAt: new Date(res.transactTime)
            })
          }
          void this.notification(tradingPair.replace('USDT', ''), 'USDT', totalAmount.toFixed(TOKEN_DECIMAL_PLACES))
        }
      }
    }
    catch (err) {
      console.log('======tokenToUsdt=======')
      console.error(err)
      void this.notification(tradingPair.replace('USDT', ''), 'USDT', totalAmount.toFixed(TOKEN_DECIMAL_PLACES), true)
      throw err
    }
  }

  /**
   * hedge USDT to CKB
   */
  async usdtToCKB () {
    const tradingPair = PayTokenIdToBinanceTradingPair[CKB_TOKEN_ID]
    let totalAmount = new Decimal(0)

    try {
      const exchangeRate = await this.exchangeRate(tradingPair)
      const { symbols }: any = await this.tradingSpecificationInfo(tradingPair)
      const tradingPairInfo = symbols[0]
      const lotSize: any = tradingPairInfo.filters.find((item) => {
        return item.filterType === 'LOT_SIZE'
      })
      const orderList = await this.tOrderListService.find({
        where: {
          payTokenId: Not(In([CKB_TOKEN_ID, DAS_TOKEN_ID])),
          toUsdtOrderId: Not(''),
          toCkbOrderId: ''
        }
      })

      if (orderList.length > 0) {
        for (const order of orderList) {
          totalAmount = totalAmount.add(order.toUsdt)
        }

        if (totalAmount.gte(MIN_HEDGE_USDT)) {
          const quantity = this.calcQuantity(totalAmount.div(exchangeRate).toFixed(tradingPairInfo.baseAssetPrecision), lotSize, tradingPairInfo.baseAssetPrecision)
          if (!(new Decimal(quantity).gte(lotSize.minQty) && new Decimal(quantity).lte(lotSize.maxQty))) {
            return
          }
          const res: any = await axios.post('/order', null, {
            params: {
              symbol: tradingPair,
              side: 'BUY',
              type: 'MARKET',
              newOrderRespType: 'RESULT',
              quantity: quantity
            },
            // @ts-expect-error
            sign: true
          })

          if (res.orderId) {
            for (const order of orderList) {
              const ckb = new Decimal(order.toUsdt).div(exchangeRate).toFixed(TOKEN_DECIMAL_PLACES)
              await this.tOrderListService.updateOne(order.id, {
                toCkb: ckb,
                toCkbOrderId: res.orderId,
                toCkbAt: new Date(res.transactTime)
              })
            }
            void this.notification('USDT', 'CKB', totalAmount.toFixed(TOKEN_DECIMAL_PLACES))
          }
        }
      }
    }
    catch (err) {
      console.log('======usdtToCKB=======')
      console.error(err)
      void this.notification('USDT', 'CKB', totalAmount.toFixed(TOKEN_DECIMAL_PLACES), true)
      throw err
    }
  }

  /**
   * push message to Lark
   * @param from tokens that need to be hedged
   * @param to hedging target tokens
   * @param amount hedge amount
   * @param fail
   */
  async notification (from: string, to: string, amount: string | number, fail: boolean = false) {
    try {
      const url = config.larkNotificationUrl

      if (fail) {
        await axios.post(url, {
          msg_type: 'post',
          content: {
            post: {
              zh_cn: {
                title: `Trading pair：${from}-${to}`,
                content: [{
                  tag: 'text',
                  text: `Hedge amount：${amount} ${from}`
                }, {
                  tag: 'text',
                  text: 'Hedging failed, retry after 10 minutes'
                }, {
                  tag: 'at',
                  user_id: 'all'
                }]
              }
            }
          }
        })
      }
      else {
        await axios.post(url, {
          msg_type: 'text',
          content: {
            text: `Trading pair：${from}-${to}\nHedge amount：${amount} ${from}\nHedge success`
          }
        })
      }
    }
    catch (err) {
      console.log('======notification=======')
      console.error(err)
    }
  }

  /**
   * error notification
   */
  async errorNotification (err: any) {
    try {
      const msg = [[{
        tag: 'text',
        text: err.code + ': ' + err.message
      }], [{
        tag: 'at',
        user_id: 'all'
      }]]
      const data = {
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: 'Error',
              content: [...msg]
            }
          }
        }
      }
      await axios.post(config.larkNotificationUrl, data)
    }
    catch (err) {
      console.log('======errorNotification=======')
      console.error(err)
    }
  }

  /**
   * account balance reminder
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async balanceNotification () {
    try {
      const res: any = await axios.get('/account', {
        params: {},
        // @ts-ignore
        sign: true
      })
      let msg = []
      let noticeToAll = false
      res.balances.forEach((balance) => {
        if (balance.free > 0 && TokenBalanceNotificationList.includes(balance.asset)) {
          msg.push([{
            tag: 'text',
            text: TokenBalanceEarlyWarningValue[balance.asset] ? `${balance.asset}[${TokenBalanceEarlyWarningValue[balance.asset]}]: ${balance.free}` : `${balance.asset}: ${balance.free}`
          }])
        }

        if (TokenBalanceEarlyWarningValue[balance.asset] && balance.free < TokenBalanceEarlyWarningValue[balance.asset]) {
          noticeToAll = true
        }
      })

      if (noticeToAll) {
        msg.push([{
          tag: 'at',
          user_id: 'all'
        }])
      }

      const data = {
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: 'Account balance:',
              content: [...msg]
            }
          }
        }
      }

      await axios.post(config.larkNotificationUrl, data)
    }
    catch (err) {
      console.log('======balanceNotification=======')
      console.error(err)
      await this.errorNotification(err)
    }
  }

  /**
   * run the CKB token hedge program every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async hedgeCoin () {
    try {
      const orderList = await this.tOrderListService.find({
        where: {
          payTokenId: Not(In([CKB_TOKEN_ID, DAS_TOKEN_ID])),
          toUsdtOrderId: '',
        }
      })

      if (orderList.length > 0) {
        const toUsdtOrderGroups = {}
        orderList.forEach(order => {
          const key = order.payTokenId
          if (key && toUsdtOrderGroups[key]) {
            toUsdtOrderGroups[key].push(order)
          }
          else {
            toUsdtOrderGroups[key] = [order]
          }
        })

        for (const groupName in toUsdtOrderGroups) {
          const tradingPair = PayTokenIdToBinanceTradingPair[groupName]
          const group = toUsdtOrderGroups[groupName]
          if (tradingPair === 'USDT') {
            await this.usdtToUsdt(group)
          }
          else if (FiatCurrencyList.includes(tradingPair)) {
            console.log('=========FiatCurrencyList.includes(tradingPair)==========')
            console.log(FiatCurrencyList.includes(tradingPair))
            console.log(tradingPair)
            console.log('===================')
            await this.fiatCurrencyToUsdt(group, tradingPair)
          }
          else if (![DAS_TOKEN_ID, CKB_TOKEN_ID].includes(groupName)) {
            await this.tokenToUsdt(group, tradingPair)
          }
        }
      }

      await this.usdtToCKB()
    }
    catch (err) {
      console.log('======hedgeCoin=======')
      console.error(err)
      await this.errorNotification(err)
    }
  }

  @Get('/test')
  async test () {
    try {
      const res = await this.hedgeCoin()
      console.log(res)
    }
    catch (err) {
      console.log('======test=======')
      console.error(err)
    }
  }
}
