import { Query } from 'express-serve-static-core'
import { Pagination } from './Post.request'

export interface SearchQuery extends Pagination, Query {
  content: string
}
