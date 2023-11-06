import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import HTTP_STATUS from '~/constants/httpStatus'
import { BOOKMARK_MESSAGES, POSTS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import {
  Pagination,
  PostParam,
  PostQuery,
  PostRequestBody,
  ResolvePostReqBody,
  UpdatePostReqBody
} from '~/models/requests/Post.request'
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
  const sort_field = req.query.sort_field
  const sort_value = Number(req.query.sort_value)
  const { total_children, post_children } = await postsService.getPostChildren({
    user_id,
    post_id: req.params.post_id,
    post_type: post_type,
    limit: limit,
    page: page,
    sort_field,
    sort_value
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

export const getGuessNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const type = req.query.type
  const sort_field = req.query.sort_field
  const sort_value = Number(req.query.sort_value)

  const result = await postsService.getGuessNewFeeds({
    limit,
    page,
    sort_field,
    sort_value
  })
  return res.json({
    message: 'Get Guess New Feeds Successfully',
    result: {
      posts: result.posts,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const type = req.query.type
  const sort_field = req.query.sort_field
  const sort_value = Number(req.query.sort_value)

  if (type === 'all') {
    const result = await postsService.getNewFeeds({
      user_id,
      limit,
      page,
      sort_field,
      sort_value
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
      page,
      sort_field,
      sort_value
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
  } else {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: 'Newfeeds not found'
    })
  }
}

export const getUserPostsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const current_user_id = req.decoded_authorization?.user_id as string
  const user_id = req.params.user_id
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const type = Number(req.query.type)

  const result = await postsService.getUserPosts({
    current_user_id,
    user_id,
    type,
    limit,
    page
  })
  return res.json({
    message: 'Get Successfully',
    result: {
      posts: result.posts,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const deletePostController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  await postsService.deletePost(user_id, req.params.post_id)
  return res.json({
    message: POSTS_MESSAGES.DELETE_POST_SUCCESS
  })
}

export const updatePostController = async (
  req: Request<ParamsDictionary, any, UpdatePostReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  const post_id = req.params.post_id
  await postsService.updatePost(user_id, post_id, body)
  return res.json({
    message: POSTS_MESSAGES.UPDATE_POST_SUCCESS
  })
}

export const resolvePostController = async (
  req: Request<ParamsDictionary, any, ResolvePostReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const resolved_id = req.body.resolved_id as string
  const post_id = req.params.post_id
  await postsService.resolvePost(user_id, post_id, resolved_id)
  return res.json({
    message: POSTS_MESSAGES.RESOLVE_POST_SUCCESS
  })
}

export const getPostsbyHashtagController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const hashtag_id = req.params.hashtag_id
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const sort_field = req.query.sort_field
  const sort_value = Number(req.query.sort_value)

  const result = await postsService.getPostsByHashtag({
    user_id,
    limit,
    page,
    hashtag_id,
    sort_field,
    sort_value
  })
  return res.json({
    message: 'Get posts by hashtag Successfully',
    result: {
      posts: result.posts,
      limit,
      page,
      posts_count: result.total,
      total_page: Math.ceil(result.total / limit),
      hashtag_name: result.hashtag?.name
    }
  })
}
