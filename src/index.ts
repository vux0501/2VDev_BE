import express from 'express'
import route from './routes/index'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import cors, { CorsOptions } from 'cors'
import { initFolder } from './utils/file'
import '~/utils/s3'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { envConfig, isProduction } from './constants/config'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const file = fs.readFileSync(path.resolve('2vdev.swagger.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

// Connect Database
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
  databaseService.indexPosts()
})

const app = express()

// Tạo folder upload
initFolder()

//rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
})

// Config
app.use(helmet())
const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : '*'
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(limiter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Connect route
route(app)
// Error Handler
app.use(defaultErrorHandler)
app.listen(envConfig.port, () => {
  console.log(`App listening on port ${envConfig.port}`)
})
