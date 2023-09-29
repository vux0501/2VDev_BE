import { PostType } from '~/constants/enums'
import { Media } from '../Other'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface PostRequestBody {
  type: PostType
  title: string
  content: string
  parent_id: null | string
  hashtags: string[]
  medias: Media[]
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
}
