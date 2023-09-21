import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
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
