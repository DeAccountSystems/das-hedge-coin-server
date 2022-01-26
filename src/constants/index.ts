// decimal places reserved for token amounts
export const TOKEN_DECIMAL_PLACES = 8

// decimal places reserved for french currency amounts
export const FIAT_DECIMAL_PLACES = 2

// minimum hedged usdt amount
export const MIN_HEDGE_USDT = 20

export const CKB_TOKEN_ID = 'ckb_ckb'
export const DAS_TOKEN_ID = 'ckb_das'

// DAS payment tokens and the corresponding USDT transaction pairs of Coinan are mapped, for fiat currency directly corresponds to the fiat abbreviation, and the USDT of each chain directly corresponds to the USDT
export const PayTokenIdToBinanceTradingPair = {
  // fiat currency
  wx_cny: 'CNY',
  // USDT for each chain
  eth_usdt: 'USDT',
  // other tokens
  [CKB_TOKEN_ID]: 'CKBUSDT',
  [DAS_TOKEN_ID]: 'CKBUSDT',
  eth_eth: 'ETHUSDT',
  btc_btc: 'BTCUSDT',
  tron_trx: 'TRXUSDT',
  bsc_bnb: 'BNBUSDT',
  polygon_matic: 'MATICUSDT',
}

// fiat currency list
export const FiatCurrencyList = [
  PayTokenIdToBinanceTradingPair.wx_cny
]

// account token balance alert list
export const TokenBalanceNotificationList = ['ETH', 'USDT', 'TRX', 'BNB', 'CKB', 'MATIC']

export const TokenBalanceEarlyWarningValue = {
  ETH: 2,
  TRX: 10000,
  BNB: 5,
  MATIC: 2000
}
