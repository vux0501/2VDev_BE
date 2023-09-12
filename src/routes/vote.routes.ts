import { Router } from 'express'
import { bookmarkPostController, unbookmarkPostController } from '~/controllers/bookmarks.controllers'
import { unVotePostController, votePostController } from '~/controllers/votes.controllers'

import { postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const voteRouters = Router()

/*
Description: Create vote
Path: /
Method: POST
body: {post_id: string}
Header: {Authorization: Bearer <access_token>}
*/
voteRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(votePostController)
)

/**
 * Description: UnVote
 * Path: /posts/:post_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
voteRouters.delete(
  '/posts/:post_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(unVotePostController)
)

export default voteRouters
