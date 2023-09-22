import { PostRequestBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { PostType } from '~/constants/enums'

class PostsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuemts = await Promise.all(
      hashtags.map((hashtag) => {
        // Tìm hashtag trong database, nếu có thì lấy, không thì tạo mới
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return hashtagDocuemts.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id)
  }
  async createPost(user_id: string, body: PostRequestBody) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const result = await databaseService.posts.insertOne(
      new Post({
        user_id: new ObjectId(user_id),
        title: body.title,
        content: body.content,
        hashtags,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type
      })
    )
    const post = await databaseService.posts.findOne({ _id: result.insertedId })
    return post
  }
  async increaseView(post_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.posts.findOneAndUpdate(
      { _id: new ObjectId(post_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )
    return result.value as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }
  async getPostChildren({
    post_id,
    post_type,
    limit,
    page
  }: {
    post_id: string
    post_type: PostType
    limit: number
    page: number
  }) {
    const post_children = await databaseService.posts
      .aggregate([
        {
          $match: {
            parent_id: new ObjectId(post_id),
            type: post_type
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_detail'
          }
        },
        {
          $addFields: {
            user_detail: {
              $map: {
                input: '$user_detail',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  name: '$$user.name',
                  avatar: '$$user.avatar',
                  role: '$$user.role',
                  point: '$$user.point'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'votes',
            localField: '_id',
            foreignField: 'post_id',
            as: 'votes_count'
          }
        },
        {
          $lookup: {
            from: 'reports',
            localField: '_id',
            foreignField: 'post_id',
            as: 'reports_count'
          }
        },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'post_children'
          }
        },
        {
          $addFields: {
            votes_count: {
              $size: '$votes_count'
            },
            reports_count: {
              $size: '$reports_count'
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$post_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', PostType.Comment]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            post_children: 0,
            user_id: 0,
            title: 0,
            hashtags: 0,
            guest_views: 0,
            user_views: 0
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const total_children = await databaseService.posts.countDocuments({
      parent_id: new ObjectId(post_id),
      type: post_type
    })
    return { post_children, total_children }
  }
}

const postsService = new PostsService()
export default postsService
