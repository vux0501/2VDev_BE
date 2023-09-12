import { PostRequestBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId } from 'mongodb'

class PostsService {
  async createPost(user_id: string, body: PostRequestBody) {
    const result = await databaseService.posts.insertOne(
      new Post({
        user_id: new ObjectId(user_id),
        title: body.title,
        content: body.content,
        hashtags: [],
        medias: body.medias
      })
    )
    const post = await databaseService.posts.findOne({ _id: result.insertedId })
    return post
  }
}

const postsService = new PostsService()
export default postsService
