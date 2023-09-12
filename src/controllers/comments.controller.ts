import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CommentRequestBody } from '~/models/requests/Comment.request'
import { PostRequestBody } from '~/models/requests/Post.request'
import { TokenPayload } from '~/models/requests/User.request'
import commentsService from '~/services/comment.services'
import postsService from '~/services/posts.services'

export const createCommentController = async (
  req: Request<ParamsDictionary, any, CommentRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await commentsService.createComment(user_id, req.body)
  return res.json({
    message: 'Create new post successfully!',
    data: result
  })
}
