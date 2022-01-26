# das-hedge-coin-server

## build setup
```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:24000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start
```

## API

### 1.hedge to CKB
```curl
curl --location --request POST 'http://127.0.0.1:24000/api/submit-order-info' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'orderId=123456' \
--data-urlencode 'payTokenId=eth-usdt' \
--data-urlencode 'payAmount=12'
```
#### resp
```json
{
  "code": 0,
  "message": ""
}
```
