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
  is_deleted?: number
  root_id: null | string
  hashtags: ObjectId[]
  medias: string[]
  resolved_id?: null | string
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
  is_deleted?: number
  root_id: null | ObjectId
  resolved_id: null | ObjectId
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
    is_deleted,
    root_id,
    type,
    hashtags,
    medias,
    resolved_id,
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
    this.is_deleted = is_deleted ? is_deleted : 0
    this.root_id = root_id ? new ObjectId(root_id) : null
    this.content = content
    this.hashtags = hashtags
    this.medias = medias
    this.resolved_id = resolved_id ? new ObjectId(resolved_id) : null
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
