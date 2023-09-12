import { Express } from 'express'
import userRouters from './users.routes'
import mediaRouters from './medias.routes'
import staticRouter from './static.routes'
import postRouters from './posts.routes'

function route(app: Express) {
  app.use('/', userRouters)
  app.use('/medias', mediaRouters)
  app.use('/static', staticRouter)
  app.use('/posts', postRouters)
}

export default route
