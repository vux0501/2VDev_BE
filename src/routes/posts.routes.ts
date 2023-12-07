import { Router } from 'express'
import {
  createPostController,
  createPostGPTController,
  deletePostController,
  deletePostForAdminController,
  getDashboard,
  getGuessNewFeedsController,
  getNewFeedsController,
  getPostChildrenController,
  getPostController,
  getPostsbyHashtagController,
  getUserPostsController,
  resolvePostController,
  unDeletePostForAdminController,
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
import {
  accessTokenValidator,
  isAdminValidator,
  isUserLoggedInValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares'
import { ResolvePostReqBody, UpdatePostReqBody } from '~/models/requests/Post.request'
import { wrapRequestHandler } from '~/utils/handlers'

const postRouters = Router()

/**
 * Description: Get dashboard
 * Path: /dashboard
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 */
postRouters.get(
  '/dashboard',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(getDashboard)
)

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

/*
Description: Create post AI
Path: /gpt
Method: POST
Body: PostRequestBody
*/
postRouters.post('/gpt', createPostValidator, wrapRequestHandler(createPostGPTController))

/**
 * Description: Get new feeds
 * Path: /newfeeds
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, type: string, sort_field: string, sort_value: number}
 */
postRouters.get(
  '/newfeeds',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

/**
 * Description: Get new feeds
 * Path: /guess-newfeeds
 * Method: GET
 * Query: {limit: number, page: number, type: string, sort_field: string, sort_value: number}
 */
postRouters.get('/guess-newfeeds', paginationValidator, wrapRequestHandler(getGuessNewFeedsController))

/**
 * Description: Get questions
 * Path: /questions
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number}
 * Body: {type: PostType}
 */
postRouters.get(
  '/userposts/:user_id',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getUserPostsController)
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
 * Query: {limit: number, page: number, post_type: PostType, sort_field: string, sort_value: number}
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
postRouters.post('/:post_id', postIdValidator, accessTokenValidator, wrapRequestHandler(deletePostController))

/**
 * Description: Delete post, children post for admin
 * Path: /:post_id
 * Method: DELETE
 * Header: { Authorization?: Bearer <access_token> }
 * Params: {post_id: string}
 */
postRouters.post(
  '/admin/:post_id',
  postIdValidator,
  accessTokenValidator,
  isAdminValidator,
  wrapRequestHandler(deletePostForAdminController)
)

/**
 * Description: unDelete post, children post for admin
 * Path: /:post_id
 * Method: DELETE
 * Header: { Authorization?: Bearer <access_token> }
 * Params: {post_id: string}
 */
postRouters.post(
  '/admin-undelete/:post_id',
  postIdValidator,
  accessTokenValidator,
  isAdminValidator,
  wrapRequestHandler(unDeletePostForAdminController)
)

/**
 * Description: update post, children post
 * Path: /:post_id
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

/**
 * Description: resolve post
 * Path: /:post_id
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: {resolved_id: string}
 */
postRouters.patch('/resolve/:post_id', accessTokenValidator, wrapRequestHandler(resolvePostController))

/**
 * Description: Get post by Hashtag
 * Path: /hashtags/:hashtag_id
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, type: string}
 */
postRouters.get(
  '/hashtags/:hashtag_id',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getPostsbyHashtagController)
)

/**
 * Description: Get post by Hashtag
 * Path: /hashtags/:hashtag_id
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, type: string}
 */
postRouters.get(
  '/hashtags/:hashtag_id',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getPostsbyHashtagController)
)

export default postRouters
