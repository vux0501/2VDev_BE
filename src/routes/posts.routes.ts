import { Router } from 'express'
import {
  createPostController,
  deletePostController,
  getNewFeedsController,
  getPostChildrenController,
  getPostController,
  updatePostController
} from '~/controllers/posts.controllers'
import { filterMiddleware } from '~/middlewares/common.middleware'
import {
  createPostValidator,
  getPostChildrenValidator,
  paginationValidator,
  postIdValidator,
  updatePostValidator
} from '~/middlewares/posts.middleware'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { UpdatePostReqBody } from '~/models/requests/Post.request'
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
 * Description: Get new feeds
 * Path: /newfeeds
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, type: string}
 */
postRouters.get(
  '/newfeeds',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

/**
 * Description: Get Post detail
 * Path: /:post_id
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 */
postRouters.get(
  '/:post_id',
  accessTokenValidator,
  postIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(getPostController)
)

/**
 * Description: Get post children
 * Path: /:post_id/children
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, post_type: PostType}
 */
postRouters.get(
  '/:post_id/children',
  postIdValidator,
  paginationValidator,
  getPostChildrenValidator,
  accessTokenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  wrapRequestHandler(getPostChildrenController)
)

/**
 * Description: Delete post, children post
 * Path: /:post_id
 * Method: DELETE
 * Header: { Authorization?: Bearer <access_token> }
 * Params: {post_id: string}
 */
postRouters.delete('/:post_id', postIdValidator, accessTokenValidator, wrapRequestHandler(deletePostController))

/**
 * Description: update post, children post
 * Path: /:user_id
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: {title: string, content: string, hashtags: string[], medias: string[]}
 */
postRouters.patch(
  '/:post_id',
  accessTokenValidator,
  updatePostValidator,
  filterMiddleware<UpdatePostReqBody>(['title', 'content', 'hashtags', 'medias']),
  wrapRequestHandler(updatePostController)
)

export default postRouters
