import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import { CommentRequestBody } from '~/models/requests/Comment.request'
import CommentAns from '~/models/schemas/Comment.schema'
import Comment from '~/models/schemas/Comment.schema'

class CommentsService {
  async createComment(user_id: string, body: CommentRequestBody) {
    const result = await databaseService.comments.insertOne(
      new CommentAns({
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(body.post_id),
        content: body.content,
        comment_parent_id: body.comment_parent_id,
        medias: body.medias
      })
    )
    console.log(body)
    const comment = await databaseService.comments.findOne({ _id: result.insertedId })
    return comment
  }
}

const commentsService = new CommentsService()
export default commentsService
