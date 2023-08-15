import express from 'express'

import dotenv from 'dotenv'
import route from './routes/index'
import databaseService from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middlewares'

// Connect Database
databaseService.connect()

const app = express()

// Config
dotenv.config()
app.use(express.json())

// Connect route
route(app)
// Error Handler
app.use(defaultErrorHandler)
app.listen(process.env.PORT || 5000, () => {
  console.log(`App listening on port ${process.env.PORT}`)
})
