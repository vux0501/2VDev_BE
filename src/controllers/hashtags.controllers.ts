import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { PostRequestBody } from '~/models/requests/Post.request'
import { TokenPayload } from '~/models/requests/User.request'
import hashtagsService from '~/services/hashtags.services'
import postsService from '~/services/posts.services'

export const getAllHashtagsController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await hashtagsService.getAllHashtags()
  return res.json({
    data: result
  })
}
