import express from 'express'
import dotenv from 'dotenv'
import databaseService from '~/services/database.services'

// Connect Database
databaseService.connect()

const app = express()

// Config
dotenv.config()
app.use(express.json())

app.listen(process.env.PORT || 5000, () => {
  console.log(`App listening on port ${process.env.PORT}`)
})
