import { Router } from 'express'
import {
  getReportPostController,
  readedReportController,
  reportPostController,
  unReportPostController
} from '~/controllers/reports.controllers'

import { unVotePostController, votePostController } from '~/controllers/votes.controllers'

import { postIdValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, isAdminValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
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

/*
Description: Create report
Path: /
Method: POST
body: {post_id: string, reason: string}
Header: {Authorization: Bearer <access_token>}
*/
reportRouters.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(getReportPostController)
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

reportRouters.post('/:post_id', wrapRequestHandler(readedReportController))

export default reportRouters
