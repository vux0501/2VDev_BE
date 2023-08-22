import { Express } from 'express'
import userRouters from './users.routes'
import mediaRouters from './medias.routes'

function route(app: Express) {
  app.use('/', userRouters)
  app.use('/medias', mediaRouters)
}

export default route
