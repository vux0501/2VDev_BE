import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import { NotificationType } from '~/constants/enums'
import Notification from '~/models/schemas/Notification.schema'
import Vote from '~/models/schemas/Vote.schema'

class VotesService {
  async votePost(user_id: string, post_id: string) {
    const result = await databaseService.votes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(post_id)
      },
      {
        $setOnInsert: new Vote({
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
    const type = post?.type
    const parent_id = post?.parent_id
    if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
      if (type === 0) {
        await databaseService.notifications.insertOne(
          new Notification({
            direct_id: new ObjectId(post_id),
            sender_id: new ObjectId(user_id),
            receiver_id: new ObjectId(receiver_id),
            type: NotificationType.VotePost
          })
        )
      } else if (type === 1) {
        await databaseService.notifications.insertOne(
          new Notification({
            direct_id: new ObjectId(post_id),
            sender_id: new ObjectId(user_id),
            receiver_id: new ObjectId(receiver_id),
            type: NotificationType.VoteRepost
          })
        )
      } else if (type === 2) {
        await databaseService.notifications.insertOne(
          new Notification({
            direct_id: parent_id as ObjectId,
            sender_id: new ObjectId(user_id),
            receiver_id: new ObjectId(receiver_id),
            type: NotificationType.VoteComment
          })
        )
      }
    }

    return result.value as WithId<Vote>
  }

  async unVotePost(user_id: string, post_id: string) {
    const result = await databaseService.votes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      post_id: new ObjectId(post_id)
    })
    return result
  }
}

const votesService = new VotesService()
export default votesService
