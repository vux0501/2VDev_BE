import { Media } from '../Other'

export interface PostRequestBody {
  title: string
  content: string
  hashtags: string[]
  medias: Media[]
}
