import { Router } from 'express'
import { bookmarkPostController, unbookmarkPostController } from '~/controllers/bookmarks.controllers'
import { getAllHashtagsController } from '~/controllers/hashtags.controllers'
import { postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouters = Router()

/*
Description: Create Bookmark
Path: /
Method: POST
body: {post_id: string}
Header: {Authorization: Bearer <access_token>}
*/
bookmarkRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(bookmarkPostController)
)

/**
 * Description: Unbookmark Post
 * Path: /posts/:post_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarkRouters.delete(
  '/posts/:post_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(unbookmarkPostController)
)

export default bookmarkRouters
