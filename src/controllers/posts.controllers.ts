import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PostType } from '~/constants/enums'
import { Pagination, PostParam, PostQuery, PostRequestBody } from '~/models/requests/Post.request'
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

export const getPostChildrenController = async (req: Request<PostParam, any, any, PostQuery>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const post_type = Number(req.query.post_type as string)
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const { total_children, post_children } = await postsService.getPostChildren({
    user_id,
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

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const type = req.query.type

  if (type === 'new') {
    const result = await postsService.getNewFeeds({
      user_id,
      limit,
      page
    })
    return res.json({
      message: 'Get New Feeds Successfully',
      result: {
        posts: result.posts,
        limit,
        page,
        total_page: Math.ceil(result.total / limit)
      }
    })
  } else if (type === 'follow') {
    const result = await postsService.getNewFeedsFollow({
      user_id,
      limit,
      page
    })
    return res.json({
      message: 'Get New Feeds Follow Successfully',
      result: {
        posts: result.posts,
        limit,
        page,
        total_page: Math.ceil(result.total / limit)
      }
    })
  }
}
