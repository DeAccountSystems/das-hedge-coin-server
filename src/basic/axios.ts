import Axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios'
import { sha256 } from 'js-sha256'
import config from '../../config'
import errno from '../constants/errno'

function signRequestInterceptor (axiosRequestConfig: AxiosRequestConfig): AxiosRequestConfig {
  // @ts-ignore
  if (!axiosRequestConfig.sign) {
    return axiosRequestConfig
  }
  axiosRequestConfig.headers['X-MBX-APIKEY'] = config.binanceAPIKey

  if (axiosRequestConfig.params) {
    axiosRequestConfig.params.timestamp = Date.now()
  }

  let queryString = ''
  for (const key in axiosRequestConfig.params) {
    if (queryString === '') {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      queryString += `${key}=${axiosRequestConfig.params[key]}`
    }
    else {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      queryString += `&${key}=${axiosRequestConfig.params[key]}`
    }
  }
  if (queryString) {
    axiosRequestConfig.params.signature = sha256.hmac(config.binanceSecretKey, queryString)
  }
  return axiosRequestConfig
}

function onFulfilled (res: AxiosResponse): AxiosResponse {
  if (res.status === errno.ok) {
    return res.data
  }
  else {
    const serverError: any = new Error(res.statusText)
    serverError.code = res.status
    throw serverError
  }
}

function onRejected (err: AxiosError): AxiosError {
  let serverError: any
  if (err.response) {
    if (err.response.data?.code) {
      serverError = new Error(err.response.data.msg)
      serverError.code = err.response.data.code
    }
    else {
      serverError = new Error(err.response.statusText)
      serverError.code = err.response.status
    }
  }
  else {
    serverError = new Error(err.message)
    serverError.code = errno.internalServerError
  }
  throw serverError
}

const axios = Axios.create({
  baseURL: config.binanceServicesApi
})
axios.interceptors.request.use(signRequestInterceptor)
axios.interceptors.response.use(onFulfilled, onRejected)

export default axios
