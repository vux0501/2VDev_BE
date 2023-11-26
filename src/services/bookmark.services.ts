import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Notification from '~/models/schemas/Notification.schema'
import { NotificationType } from '~/constants/enums'

class BookmarksService {
  async bookmarkPost(user_id: string, post_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(post_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          post_id: new ObjectId(post_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    const post = await databaseService.posts.findOne({ _id: new ObjectId(post_id) })
    const receiver_id = post?.user_id

    if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
      await databaseService.notifications.insertOne(
        new Notification({
          direct_id: new ObjectId(post_id),
          sender_id: new ObjectId(user_id),
          receiver_id: receiver_id as ObjectId,
          type: NotificationType.Bookmark
        })
      )
    }

    return result.value as WithId<Bookmark>
  }

  async unbookmarkPost(user_id: string, post_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      post_id: new ObjectId(post_id)
    })
    return result
  }

  async getMyBookmarks(user_id: string, limit: number, page: number) {
    const [posts, total] = await Promise.all([
      databaseService.bookmarks
        .aggregate([
          {
            $match: {
              user_id: new ObjectId(user_id)
            }
          },
          {
            $lookup: {
              from: 'posts',
              localField: 'post_id',
              foreignField: '_id',
              as: 'post_detail'
            }
          },
          {
            $unwind: {
              path: '$post_detail'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'post_detail.user_id',
              foreignField: '_id',
              as: 'user_detail'
            }
          },
          {
            $unwind: {
              path: '$user_detail'
            }
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'post_detail.hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $project: {
              'user_detail.password': 0,
              'user_detail.email_verify_token': 0,
              'user_detail.forgot_password_token': 0,
              user_id: 0,
              post_id: 0,
              'post_detail.hashtags': 0
            }
          },
          {
            $sort: {
              created_at: -1
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.bookmarks
        .aggregate([
          {
            $match: {
              user_id: new ObjectId(user_id)
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    if (posts.length === 0) {
      return {
        posts: [],
        total: 0
      }
    }

    return {
      posts,
      total: total[0].total
    }
  }
}

const bookmarksService = new BookmarksService()
export default bookmarksService
