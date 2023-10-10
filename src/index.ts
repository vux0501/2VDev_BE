import express from 'express'
import route from './routes/index'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import cors from 'cors'
import { initFolder } from './utils/file'
import '~/utils/s3'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import swaggerUi from 'swagger-ui-express'
import { envConfig } from './constants/config'

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

// Config
app.use(cors())
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Connect route
route(app)
// Error Handler
app.use(defaultErrorHandler)
app.listen(envConfig.port, () => {
  console.log(`App listening on port ${envConfig.port}`)
})
