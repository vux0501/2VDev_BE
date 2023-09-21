import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Report from '~/models/schemas/Report.schema'
import ReportPost from '~/models/schemas/Report.schema'

class ReportsService {
  async reportPost(user_id: string, post_id: string, reason: string) {
    const result = await databaseService.reports.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        post_id: new ObjectId(post_id),
        reason: reason
      },
      {
        $setOnInsert: new ReportPost({
          user_id: new ObjectId(user_id),
          post_id: new ObjectId(post_id),
          reason: reason
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result.value as WithId<ReportPost>
  }

  async unReportPost(user_id: string, post_id: string) {
    const result = await databaseService.reports.findOneAndDelete({
      user_id: new ObjectId(user_id),
      post_id: new ObjectId(post_id)
    })
    return result
  }
}

const reportsService = new ReportsService()
export default reportsService
