import { Router } from 'express'
import { createPostController, getPostController } from '~/controllers/posts.controllers'
import { createPostValidator, postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
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

/**
 * Description: Get Post detail
 * Path: /:post_id
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 */
postRouters.get(
  '/:post_id',
  postIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(getPostController)
)

export default postRouters
