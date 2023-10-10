import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { USERS_MESSAGES } from '~/constants/messages'
import { SearchQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'

export const searchPostController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await searchService.searchPost({
    limit,
    page,
    content: req.query.content,
    user_id: req.decoded_authorization?.user_id as string
  })
  res.json({
    message: 'Search post Successfully',
    result: {
      posts: result.posts,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const searchUserController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const user = await searchService.searchUser({
    limit,
    page,
    content: req.query.content,
    user_id: req.decoded_authorization?.user_id as string
  })
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}
