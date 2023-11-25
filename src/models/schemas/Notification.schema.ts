import { ObjectId } from 'mongodb'
import { NotificationType as NotiEnum } from '~/constants/enums'

interface NotificationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  is_readed?: number
  type: NotiEnum
  direct_id: ObjectId
  created_at?: Date
}
export default class Notification {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  is_readed?: number
  direct_id: ObjectId
  type: NotiEnum
  created_at?: Date
  constructor({ _id, sender_id, receiver_id, is_readed, direct_id, type, created_at }: NotificationType) {
    this._id = _id
    this.sender_id = sender_id
    this.receiver_id = receiver_id
    this.is_readed = is_readed ? is_readed : 0
    this.type = type
    this.direct_id = direct_id
    this.created_at = created_at || new Date()
  }
}
