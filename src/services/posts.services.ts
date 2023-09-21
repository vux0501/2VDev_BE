import { PostRequestBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

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
}

const postsService = new PostsService()
export default postsService
