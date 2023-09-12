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
    const comment = await databaseService.comments.findOne({ _id: result.insertedId })
    return comment
  }

  async getAllCommentOfPost(post_id: string) {
    const result = await databaseService.comments
      .aggregate([
        {
          $match: {
            post_id: new ObjectId(post_id)
          }
        },
        {
          $group: {
            _id: null,
            comments: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            comments: 1,
            count: 1
          }
        }
      ])
      .toArray()
    if (result.length > 0) {
      return result[0]
    } else {
      return 'Chưa có bình luận nào'
    }
  }
}

const commentsService = new CommentsService()
export default commentsService
