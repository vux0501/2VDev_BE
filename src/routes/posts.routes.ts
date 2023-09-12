import { Router } from 'express'
import { createPostController } from '~/controllers/posts.controllers'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const postRouters = Router()

/*
Description: Create post
Path: /
Method: POST
Body: PostRequestBody
*/
postRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createPostValidator,
  wrapRequestHandler(createPostController)
)

export default postRouters
