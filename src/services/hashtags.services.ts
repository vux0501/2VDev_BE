import { PostRequestBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

class HashtagsService {
  async getAllHashtags() {
    const result = await databaseService.posts
      .aggregate([
        {
          $unwind: '$hashtags'
        },
        {
          $group: {
            _id: '$hashtags',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: '_id',
            foreignField: '_id',
            as: 'hashtag'
          }
        },
        {
          $unwind: '$hashtag'
        },
        {
          $project: {
            name: '$hashtag.name',
            count: 1
          }
        },
        {
          $sort: {
            count: -1 // Sắp xếp theo count nhỏ dần (tăng dần)
          }
        }
      ])
      .toArray()
    return result
  }
}

const hashtagsService = new HashtagsService()
export default hashtagsService
