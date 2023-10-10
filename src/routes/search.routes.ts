import { Router } from 'express'
import { searchPostController, searchUserController } from '~/controllers/search.controllers'
import { paginationValidator } from '~/middlewares/posts.middleware'
import { searchValidator } from '~/middlewares/search.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

const searchRouters = Router()

/**
 * Description: Search post
 * Path: /post?content={content}&limit={limit}&page={page}
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, content: string}
 */
searchRouters.get(
  '/post/',
  accessTokenValidator,
  verifiedUserValidator,
  searchValidator,
  paginationValidator,
  searchPostController
)

/**
 * Description: Search user
 * Path: /user?content={content}&limit={limit}&page={page}
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number, content: string}
 */
searchRouters.get(
  '/user/',
  accessTokenValidator,
  verifiedUserValidator,
  searchValidator,
  paginationValidator,
  searchUserController
)

export default searchRouters
