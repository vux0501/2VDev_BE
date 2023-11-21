import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { BookmarkRequestBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.request'
import bookmarksService from '~/services/bookmark.services'

export const bookmarkPostController = async (
  req: Request<ParamsDictionary, any, BookmarkRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.bookmarkPost(user_id, req.body.post_id)
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    data: result
  })
}

export const unbookmarkPostController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  await bookmarksService.unbookmarkPost(user_id, req.params.post_id)
  return res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY
  })
}

export const getMyBookmarksController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await bookmarksService.getMyBookmarks(user_id, limit, page)
  return res.json({
    message: BOOKMARK_MESSAGES.GET_BOOKMARK_SUCCESSFULLY,
    result: result.posts,
    limit,
    page,
    total_post: result.total,
    total_page: Math.ceil(result.total / limit)
  })
}
