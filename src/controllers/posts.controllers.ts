import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PostType } from '~/constants/enums'
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

export const getPostController = async (req: Request, res: Response) => {
  const result = await postsService.increaseView(req.params.post_id, req.decoded_authorization?.user_id)
  const post = {
    ...req.post,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: 'Get post Successfully',
    result: post
  })
}

export const getPostChildrenController = async (req: Request, res: Response) => {
  const post_type = Number(req.query.post_type as string)
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const { total_children, post_children } = await postsService.getPostChildren({
    post_id: req.params.post_id,
    post_type: post_type,
    limit: limit,
    page: page
  })
  return res.json({
    message: 'Get children Successfully',
    result: {
      post_children: post_children,
      post_type: post_type,
      limit: limit,
      page: page,
      total_children,
      total_page: Math.ceil(total_children / limit)
    }
  })
}
