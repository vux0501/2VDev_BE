import { ObjectId } from 'mongodb'
import { PostType, ResolvedType } from '~/constants/enums'
import { Media } from '~/models/Other'

interface PostConstructor {
  _id?: ObjectId
  user_id: ObjectId
  title?: string
  content: string
  type: PostType
  parent_id: null | string
  hashtags: ObjectId[]
  medias: string[]
  resolved?: ResolvedType
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export default class Post {
  _id?: ObjectId
  user_id: ObjectId
  title: string | null
  content: string
  hashtags: ObjectId[]
  medias: string[]
  type: PostType
  parent_id: null | ObjectId
  resolved: ResolvedType
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    user_id,
    title,
    content,
    parent_id,
    type,
    hashtags,
    medias,
    resolved,
    guest_views,
    user_views,
    created_at,
    updated_at
  }: PostConstructor) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.title = title || null
    this.type = type
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.content = content
    this.hashtags = hashtags
    this.medias = medias
    this.resolved = resolved || ResolvedType.unResolved
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
