import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import {
  getCountNotificationController,
  getNotificationController,
  readedNotificationController
} from '~/controllers/notifications.controllers'
import { paginationValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const notificationRouters = Router()

notificationRouters.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  wrapRequestHandler(getNotificationController)
)

notificationRouters.post('/:notification_id', wrapRequestHandler(readedNotificationController))

notificationRouters.get(
  '/count',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getCountNotificationController)
)

export default notificationRouters
