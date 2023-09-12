import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES, VOTE_MESSAGES } from '~/constants/messages'
import { BookmarkRequestBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.request'
import { VoteRequestBody } from '~/models/requests/Vote.request'
import bookmarksService from '~/services/bookmark.services'
import votesService from '~/services/vote.services'

export const votePostController = async (
  req: Request<ParamsDictionary, any, VoteRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await votesService.votePost(user_id, req.body.post_id)
  return res.json({
    message: VOTE_MESSAGES.VOTE_SUCCESSFULLY,
    data: result
  })
}

export const unVotePostController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  await votesService.unVotePost(user_id, req.params.post_id)
  return res.json({
    message: VOTE_MESSAGES.UNVOTE_SUCCESSFULLY
  })
}
