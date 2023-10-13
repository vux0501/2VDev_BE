import { PostType } from '~/constants/enums'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'

export interface PostRequestBody {
  type: PostType
  title: string
  content: string
  parent_id: null | string
  hashtags: string[]
  medias: string[]
}

export interface PostParam extends ParamsDictionary {
  post_id: string
}

export interface PostQuery extends Pagination, Query {
  post_type: string
}

export interface Pagination {
  limit: string
  page: string
  type: string
}

export interface UpdatePostReqBody {
  title?: string
  content?: string
  hashtags?: string[]
  medias?: string[]
}
