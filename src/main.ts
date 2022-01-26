import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ApplicationModule } from './app.module'
import config from '../config'

async function bootstrap () {
  const appOptions = { cors: true }
  const app = await NestFactory.create<NestExpressApplication>(ApplicationModule, appOptions)

  app.setGlobalPrefix('api')
  app.set('trust proxy', 'loopback')

  await app.listen(config.port).then(res => {
    console.log(`app is running on port ${config.port}`, `http://127.0.0.1:${config.port}/api`)
  })

  // notify pm2 when server is started
  process.send?.('ready')
}

void bootstrap()
