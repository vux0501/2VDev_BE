import { Media } from '../Other'
import { ParamsDictionary } from 'express-serve-static-core'

export interface CommentRequestBody {
  post_id: string
  content: string
  comment_parent_id: null | string
  medias: Media[]
}

export interface GetAllCommentReqParams extends ParamsDictionary {
  post_id: string
}
