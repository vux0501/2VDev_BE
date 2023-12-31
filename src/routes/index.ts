import { Express } from 'express'
import userRouters from './users.routes'
import mediaRouters from './medias.routes'
import staticRouter from './static.routes'
import postRouters from './posts.routes'
import hashtagRouters from './hashtags.routes'
import bookmarkRouters from './bookmark.routes'
import voteRouters from './vote.routes'
import reportRouters from './reports.routes'
import searchRouters from './search.routes'
import notificationRouters from './notifications.routes'

function route(app: Express) {
  app.use('/users', userRouters)
  app.use('/posts', postRouters)
  app.use('/medias', mediaRouters)
  app.use('/static', staticRouter)
  app.use('/hashtags', hashtagRouters)
  app.use('/bookmarks', bookmarkRouters)
  app.use('/votes', voteRouters)
  app.use('/reports', reportRouters)
  app.use('/search', searchRouters)
  app.use('/notifications', notificationRouters)
}

export default route
