import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CommentRequestBody, GetAllCommentReqParams } from '~/models/requests/Comment.request'
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
    message: 'Create new comment successfully!',
    data: result
  })
}

export const getAllCommentOfPost = async (req: Request<GetAllCommentReqParams>, res: Response, next: NextFunction) => {
  const { post_id } = req.params
  const result = await commentsService.getAllCommentOfPost(post_id)
  return res.json({
    result
  })
}
