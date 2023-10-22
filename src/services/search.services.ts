import { ObjectId } from 'mongodb'
import { PostType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'

class SearchService {
  async searchPost({
    limit,
    page,
    content,
    user_id
  }: {
    limit: number
    page: number
    content: string
    user_id: string
  }) {
    const $match: any = {
      $text: {
        $search: content
      },
      type: PostType.Post
    }
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'votes',
              localField: '_id',
              foreignField: 'post_id',
              as: 'votes'
            }
          },
          {
            $addFields: {
              is_voted: {
                $cond: {
                  if: {
                    $in: [new ObjectId(user_id), '$votes.user_id']
                  },
                  then: 1,
                  else: 0
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'post_id',
              as: 'bookmarks'
            }
          },
          {
            $addFields: {
              is_bookmarked: {
                $cond: {
                  if: {
                    $in: [new ObjectId(user_id), '$bookmarks.user_id']
                  },
                  then: 1,
                  else: 0
                }
              }
            }
          },
          {
            $lookup: {
              from: 'reports',
              localField: '_id',
              foreignField: 'post_id',
              as: 'reports'
            }
          },
          {
            $addFields: {
              is_reported: {
                $cond: {
                  if: {
                    $in: [new ObjectId(user_id), '$reports.user_id']
                  },
                  then: 1,
                  else: 0
                }
              }
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
                    point: '$$user.point',
                    username: '$$user.username'
                  }
                }
              }
            }
          },
          {
            $skip: limit * (page - 1) // Công thức phân trang
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $addFields: {
              hashtags: {
                $map: {
                  input: '$hashtags',
                  as: 'hashtag',
                  in: {
                    _id: '$$hashtag._id',
                    name: '$$hashtag.name'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'post_id',
              as: 'bookmarks_count'
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
              bookmarks_count: {
                $size: '$bookmarks_count'
              },
              votes_count: {
                $size: '$votes_count'
              },
              reports_count: {
                $size: '$reports_count'
              },
              repost_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', PostType.Repost]
                    }
                  }
                }
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
              },
              views_count: {
                $add: ['$user_views', '$guest_views']
              }
            }
          },
          {
            $unwind: {
              path: '$user_detail'
            }
          },
          {
            $project: {
              post_children: 0,
              user_id: 0,
              votes: 0,
              bookmarks: 0,
              reports: 0
            }
          }
        ])
        .toArray(),
      databaseService.posts
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    const post_ids = posts.map((post) => post._id as ObjectId)
    const date = new Date()
    await databaseService.posts.updateMany(
      {
        _id: {
          $in: post_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    posts.forEach((post) => {
      post.updated_at = date
      post.user_views += 1
    })

    return {
      posts,
      total: total[0]?.total
    }
  }

  async searchUser({
    limit,
    page,
    content,
    user_id
  }: {
    limit: number
    page: number
    content: string
    user_id: string
  }) {
    const $match: any = {
      $or: [
        {
          $text: {
            $search: content
          }
        },
        {
          username: {
            $regex: `.*${content}.*`, // Partial search for username
            $options: 'i' // Case-insensitive search
          }
        }
      ]
    }
    const list_users = await databaseService.users
      .aggregate([
        {
          $match
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'user_id',
            as: 'following'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'followed_user_id',
            as: 'followers'
          }
        },
        {
          $addFields: {
            following: {
              $size: '$following'
            },
            followers: {
              $size: '$followers'
            },
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(user_id), '$followers.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            password: 0,
            forgot_password_token: 0,
            email_verify_token: 0
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const totalUser = list_users.length
    const totalPage = Math.ceil(totalUser / limit)

    if (list_users === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.LIST_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { list_users, currentPage: page, userPerPage: limit, totalUser: totalUser, totalPage: totalPage }
  }
}

const searchService = new SearchService()

export default searchService
