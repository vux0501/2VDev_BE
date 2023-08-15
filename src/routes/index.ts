import { Express } from 'express'
import userRouters from './users.routes'

function route(app: Express) {
  app.use('/', userRouters)
}

export default route
