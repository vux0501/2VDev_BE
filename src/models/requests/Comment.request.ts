import { Media } from '../Other'

export interface CommentRequestBody {
  post_id: string
  content: string
  comment_parent_id: null | string
  medias: Media[]
}
