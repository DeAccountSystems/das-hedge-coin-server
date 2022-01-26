const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  isDev,
  port: process.env.PORT || 24000,
  binanceServicesApi: 'https://api2.binance.com/api/v3',
  binanceAPIKey: '',
  binanceSecretKey: '',
  larkNotificationUrl: '',
  mysqlOptions: {
    name: '',
    host: '',
    port: 3306,
    username: '',
    password: '',
    database: '',
    table: {
      t_order_list: 't_order_list'
    },
    logging: true,
    charset: 'utf8mb4_general_ci',
  }
}
