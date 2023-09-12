import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PostRequestBody } from '~/models/requests/Post.request'
import { TokenPayload } from '~/models/requests/User.request'
import postsService from '~/services/posts.services'

export const createPostController = async (
  req: Request<ParamsDictionary, any, PostRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await postsService.createPost(user_id, req.body)
  return res.json({
    message: 'Create new post successfully!',
    data: result
  })
}
