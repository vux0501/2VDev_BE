import { Express } from 'express'
import userRouters from './users.routes'
import mediaRouters from './medias.routes'
import staticRouter from './static.routes'
import postRouters from './posts.routes'
import hashtagRouters from './hashtags.routes'
import bookmarkRouters from './bookmark.routes'
import voteRouters from './vote.routes'
import reportRouters from './reports.routes'

function route(app: Express) {
  app.use('/', userRouters)
  app.use('/medias', mediaRouters)
  app.use('/static', staticRouter)
  app.use('/posts', postRouters)
  app.use('/hashtags', hashtagRouters)
  app.use('/bookmarks', bookmarkRouters)
  app.use('/votes', voteRouters)
  app.use('/reports', reportRouters)
}

export default route
