import { PostType } from '~/constants/enums'
import { Media } from '../Other'

export interface PostRequestBody {
  type: PostType
  title: string
  content: string
  parent_id: null | string
  hashtags: string[]
  medias: Media[]
}
