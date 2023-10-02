import express from 'express'
import dotenv from 'dotenv'
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

const file = fs.readFileSync(path.resolve('2vdev.swagger.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

// Connect Database
databaseService.connect()

const app = express()

// Tạo folder upload
initFolder()

// Config
dotenv.config()
app.use(cors())
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Connect route
route(app)
// Error Handler
app.use(defaultErrorHandler)
app.listen(process.env.PORT || 5000, () => {
  console.log(`App listening on port ${process.env.PORT}`)
})
