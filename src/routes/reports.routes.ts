import { Router } from 'express'
import { reportPostController, unReportPostController } from '~/controllers/reports.controllers'

import { unVotePostController, votePostController } from '~/controllers/votes.controllers'

import { postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const reportRouters = Router()

/*
Description: Create report
Path: /
Method: POST
body: {post_id: string, reason: string}
Header: {Authorization: Bearer <access_token>}
*/
reportRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(reportPostController)
)

/**
 * Description: Unreport
 * Path: /posts/:post_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
reportRouters.delete(
  '/posts/:post_id',
  accessTokenValidator,
  verifiedUserValidator,
  postIdValidator,
  wrapRequestHandler(unReportPostController)
)

export default reportRouters
