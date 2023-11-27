import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'

class NotificationsService {
  async getNotifications(user_id: string, limit: number, page: number) {
    const notifications = await databaseService.notifications
      .aggregate([
        {
          $match: {
            receiver_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'sender_detail'
          }
        },
        {
          $unwind: {
            path: '$sender_detail'
          }
        },
        {
          $project: {
            'sender_detail._id': 1,
            'sender_detail.name': 1,
            'sender_detail.username': 1,
            'sender_detail.avatar': 1,
            is_readed: 1,
            type: 1,
            direct_id: 1,
            created_at: 1
          }
        },
        {
          $sort: {
            created_at: -1
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const total = await databaseService.notifications
      .aggregate([
        {
          $match: {
            receiver_id: new ObjectId(user_id)
          }
        },
        {
          $count: 'total'
        }
      ])
      .toArray()

    if (notifications.length === 0) {
      return {
        notifications: [],
        total: 0
      }
    }

    return {
      notifications,
      total: total[0].total
    }
  }
  async readedNotification(notification_id: string) {
    await databaseService.notifications.updateOne({ _id: new ObjectId(notification_id) }, { $set: { is_readed: 1 } })
  }
  async getCountNotification(user_id: string) {
    const noti_count = await databaseService.notifications
      .aggregate([
        {
          $match: {
            receiver_id: new ObjectId(user_id),
            is_readed: 0
          }
        },
        {
          $count: 'total'
        }
      ])
      .toArray()

    if (noti_count.length === 0) {
      return {
        noti_count: 0
      }
    }
    return {
      noti_count: noti_count[0].total
    }
  }
}

const notificationsService = new NotificationsService()
export default notificationsService
