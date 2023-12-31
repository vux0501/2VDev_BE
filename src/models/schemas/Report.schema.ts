import { ObjectId } from 'mongodb'

interface ReportPostType {
  _id?: ObjectId
  user_id: ObjectId
  post_id: ObjectId
  reason: string
  is_readed?: number
  created_at?: Date
}
export default class ReportPost {
  _id: ObjectId
  user_id: ObjectId
  post_id: ObjectId
  is_readed?: number
  reason: string

  created_at?: Date
  constructor({ _id, user_id, post_id, is_readed, reason, created_at }: ReportPostType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.post_id = post_id
    this.is_readed = is_readed ? is_readed : 0
    this.reason = reason || ''
    this.created_at = created_at || new Date()
  }
}
