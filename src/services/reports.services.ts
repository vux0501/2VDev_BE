import Bookmark from '~/models/schemas/Bookmark.schema'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Report from '~/models/schemas/Report.schema'
import ReportPost from '~/models/schemas/Report.schema'
import { PostType } from '~/constants/enums'

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

  async getReportPost({ limit, page }: { limit: number; page: number }) {
    const [posts, total] = await Promise.all([
      databaseService.reports
        .aggregate([
          {
            $match: {}
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user_report'
            }
          },
          {
            $unwind: {
              path: '$user_report'
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
            $project: {
              post_detail: 1,
              'user_detail._id': 1,
              'user_detail.avatar': 1,
              'user_detail.username': 1,
              'user_detail.name': 1,
              'user_detail.point': 1,
              'user_report.name': 1,
              'user_report.username': 1,
              'user_report.avatar': 1,
              'user_report.point': 1,
              'user_report._id': 1,
              reason: 1,
              is_readed: 1,
              created_at: 1
            }
          },
          {
            $sort: {
              created_at: -1
            }
          },
          {
            $skip: limit * (page - 1) // Công thức phân trang
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.reports
        .aggregate([
          {
            $match: {}
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    return {
      posts,
      total: total[0].total
    }
  }
  async readedReport(post_id: string) {
    await databaseService.reports.updateOne({ _id: new ObjectId(post_id) }, { $set: { is_readed: 1 } })
  }
}

const reportsService = new ReportsService()
export default reportsService
