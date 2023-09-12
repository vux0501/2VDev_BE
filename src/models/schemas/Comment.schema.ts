import { ObjectId } from 'mongodb'
import { ApprovedType, ChoosedType, ResolvedType } from '~/constants/enums'
import { Media } from '~/models/Other'

interface CommentConstructor {
  _id?: ObjectId
  user_id: ObjectId
  post_id: ObjectId
  comment_parent_id: null | string //  chỉ null khi comment gốc
  choosed?: ChoosedType
  content: string
  medias: Media[]
  vote?: number
  created_at?: Date
  updated_at?: Date
}

export default class CommentAns {
  _id?: ObjectId
  user_id: ObjectId
  post_id: ObjectId
  comment_parent_id: null | ObjectId //  chỉ null khi comment gốc
  choosed: ChoosedType
  content: string
  medias: Media[]
  vote: number
  created_at?: Date
  updated_at?: Date
  constructor({
    _id,
    user_id,
    post_id,
    comment_parent_id,
    choosed,
    content,
    medias,
    vote,
    created_at,
    updated_at
  }: CommentConstructor) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.post_id = post_id
    this.content = content
    this.comment_parent_id = comment_parent_id ? new ObjectId(comment_parent_id) : null
    this.medias = medias
    this.choosed = choosed || ChoosedType.unChoosed
    this.vote = vote || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
