import { PostRequestBody, UpdatePostReqBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { NotificationType, PostType } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'
import { POSTS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import Notification from '~/models/schemas/Notification.schema'

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
        root_id: body.root_id,
        type: body.type
      })
    )
    const post = await databaseService.posts.findOne({ _id: result.insertedId })
    const post_type = post?.type

    if (post_type === 2) {
      const post_parent_id = post?.parent_id
      const post_parent = await databaseService.posts.findOne({ _id: post_parent_id as ObjectId })
      const post_parent_type = post_parent?.type

      if (post_parent_type === 0) {
        const receiver_id = post_parent?.user_id

        if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
          await databaseService.notifications.insertOne(
            new Notification({
              direct_id: post_parent_id as ObjectId,
              sender_id: new ObjectId(user_id),
              receiver_id: new ObjectId(receiver_id),
              type: NotificationType.Comment
            })
          )
        }
      }
    } else if (post_type === 1) {
      const post_parent_id = post?.parent_id
      const post_parent = await databaseService.posts.findOne({ _id: post_parent_id as ObjectId })
      const post_parent_type = post_parent?.type

      if (post_parent_type === 0) {
        const receiver_id = post_parent?.user_id

        if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
          await databaseService.notifications.insertOne(
            new Notification({
              direct_id: post_parent_id as ObjectId,
              sender_id: new ObjectId(user_id),
              receiver_id: new ObjectId(receiver_id),
              type: NotificationType.Repost
            })
          )
        }
      }
    }
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
    user_id,
    post_id,
    post_type,
    limit,
    page,
    sort_field,
    sort_value
  }: {
    user_id: string
    post_id: string
    post_type: PostType
    limit: number
    page: number
    sort_field: string
    sort_value: number
  }) {
    const post_children = await databaseService.posts
      .aggregate([
        {
          $match: {
            parent_id: new ObjectId(post_id),
            type: post_type,
            is_deleted: 0
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
            comments_count: {
              $size: {
                $filter: {
                  input: '$post_children',
                  as: 'item',
                  cond: {
                    $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
                  }
                }
              }
            }
          }
        },
        {
          $sort: {
            [sort_field]: sort_value
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
            title: 0,
            hashtags: 0,
            guest_views: 0,
            user_views: 0,
            votes: 0,
            reports: 0
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
  async getNewFeeds({
    user_id,
    limit,
    page,
    sort_field,
    sort_value
  }: {
    user_id: string
    limit: number
    page: number
    sort_field: string
    sort_value: number
  }) {
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: PostType.Post,
              is_deleted: 0
            }
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
              reposts_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Repost] }, { $eq: ['$$item.is_deleted', 0] }]
                    }
                  }
                }
              },
              comments_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
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
          },
          {
            $sort: {
              [sort_field]: sort_value
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
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: PostType.Post
            }
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
      total: total[0].total
    }
  }

  async getUserPosts({
    current_user_id,
    user_id,
    type,
    limit,
    page
  }: {
    current_user_id: string
    user_id: string
    type: PostType
    limit: number
    page: number
  }) {
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: type,
              user_id: new ObjectId(user_id),
              is_deleted: 0
            }
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
                    $in: [new ObjectId(current_user_id), '$votes.user_id']
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
                    $in: [new ObjectId(current_user_id), '$bookmarks.user_id']
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
                    $in: [new ObjectId(current_user_id), '$reports.user_id']
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
              reposts_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Repost] }, { $eq: ['$$item.is_deleted', 0] }]
                    }
                  }
                }
              },
              comments_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
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
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: type,
              user_id: new ObjectId(user_id)
            }
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

    if (posts.length === 0) {
      return {
        posts: [],
        total: 0
      }
    } else {
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
        total: total[0].total
      }
    }
  }

  async getGuessNewFeeds({
    limit,
    page,
    sort_field,
    sort_value
  }: {
    limit: number
    page: number
    sort_field: string
    sort_value: number
  }) {
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: PostType.Post,
              is_deleted: 0
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
              reposts_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Repost] }, { $eq: ['$$item.is_deleted', 0] }]
                    }
                  }
                }
              },
              comments_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
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
          },
          {
            $sort: {
              [sort_field]: sort_value
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
      databaseService.posts
        .aggregate([
          {
            $match: {
              type: PostType.Post
            }
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
      total: total[0].total
    }
  }

  async getNewFeedsFollow({
    user_id,
    limit,
    page,
    sort_field,
    sort_value
  }: {
    user_id: string
    limit: number
    page: number
    sort_field: string
    sort_value: number
  }) {
    const user_id_obj = new ObjectId(user_id)
    const followed_user_ids = await databaseService.followers
      .find(
        {
          user_id: user_id_obj
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(user_id_obj)
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              },
              type: PostType.Post,
              is_deleted: 0
            }
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
              reposts_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Repost] }, { $eq: ['$$item.is_deleted', 0] }]
                    }
                  }
                }
              },
              comments_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
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
          },
          {
            $sort: {
              [sort_field]: sort_value
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
      databaseService.posts
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              },
              type: PostType.Post
            }
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
      total: total[0].total
    }
  }

  async deletePost(user_id: string, post_id: string) {
    await databaseService.posts.updateOne({ _id: new ObjectId(post_id) }, { $set: { is_deleted: 2 } })
    await databaseService.posts.updateOne({ root_id: new ObjectId(post_id) }, { $set: { is_deleted: 2 } })
  }

  async deletePostForAdmin(post_id: string) {
    await databaseService.posts.updateOne({ _id: new ObjectId(post_id) }, { $set: { is_deleted: 1 } })

    await databaseService.posts.updateOne({ root_id: new ObjectId(post_id) }, { $set: { is_deleted: 1 } })
    const post = await databaseService.posts.findOne({ _id: new ObjectId(post_id) })
    const user_id = post?.user_id
    const admin_id = new ObjectId('64df48cc7295b028891a264d')

    await databaseService.notifications.insertOne(
      new Notification({
        direct_id: new ObjectId(post_id),
        sender_id: admin_id,
        receiver_id: user_id as ObjectId,
        type: NotificationType.AdminDelete
      })
    )
  }

  async unDeletePostForAdmin(post_id: string) {
    await databaseService.posts.updateOne({ _id: new ObjectId(post_id) }, { $set: { is_deleted: 0 } })
    await databaseService.posts.updateOne({ root_id: new ObjectId(post_id) }, { $set: { is_deleted: 0 } })
  }

  async updatePost(user_id: string, post_id: string, payload: UpdatePostReqBody) {
    if (payload.hashtags) {
      const hashtags = await this.checkAndCreateHashtags(payload.hashtags)
      payload.hashtags = hashtags.map(String)
    } else {
      const newHashtags = await this.checkAndCreateHashtags([])
      payload.hashtags = newHashtags.map(String)
    }

    const hashtagsUpdate = payload.hashtags.map((hashtag: string) => new ObjectId(hashtag))

    await databaseService.posts.findOneAndUpdate(
      {
        _id: new ObjectId(post_id),
        user_id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(payload as any),
          hashtags: hashtagsUpdate
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after'
      }
    )
  }

  async resolvePost(user_id: string, post_id: string, resolve_id: string) {
    if (resolve_id === null) {
      await databaseService.posts.findOneAndUpdate(
        {
          _id: new ObjectId(post_id),
          user_id: new ObjectId(user_id)
        },
        {
          $set: {
            resolved_id: null
          },
          $currentDate: {
            updated_at: true
          }
        }
      )

      const comment = await databaseService.posts.findOne({ _id: new ObjectId(resolve_id) })
      const receiver_id = comment?.user_id
      if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
        await databaseService.notifications.insertOne(
          new Notification({
            direct_id: new ObjectId(post_id),
            sender_id: new ObjectId(user_id),
            receiver_id: new ObjectId(receiver_id),
            type: NotificationType.Pin
          })
        )
      }
    } else {
      await databaseService.posts.findOneAndUpdate(
        {
          _id: new ObjectId(post_id),
          user_id: new ObjectId(user_id)
        },
        {
          $set: {
            resolved_id: new ObjectId(resolve_id)
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    }
    const comment = await databaseService.posts.findOne({ _id: new ObjectId(resolve_id) })
    const receiver_id = comment?.user_id
    if (new ObjectId(user_id).toString() !== receiver_id?.toString()) {
      await databaseService.notifications.insertOne(
        new Notification({
          direct_id: new ObjectId(post_id),
          sender_id: new ObjectId(user_id),
          receiver_id: new ObjectId(receiver_id),
          type: NotificationType.Pin
        })
      )
    }
  }

  async getPostsByHashtag({
    user_id,
    limit,
    page,
    hashtag_id,
    sort_field,
    sort_value
  }: {
    user_id: string
    limit: number
    page: number
    hashtag_id: string
    sort_field: string
    sort_value: number
  }) {
    const [posts, total] = await Promise.all([
      databaseService.posts
        .aggregate([
          {
            $match: {
              hashtags: {
                $in: [new ObjectId(hashtag_id)]
              },
              type: 0,
              is_deleted: 0
            }
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
              reposts_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Repost] }, { $eq: ['$$item.is_deleted', 0] }]
                    }
                  }
                }
              },
              comments_count: {
                $size: {
                  $filter: {
                    input: '$post_children',
                    as: 'item',
                    cond: {
                      $and: [{ $eq: ['$$item.type', PostType.Comment] }, { $eq: ['$$item.is_deleted', 0] }]
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
          },
          {
            $sort: {
              [sort_field]: sort_value
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.posts
        .aggregate([
          {
            $match: {
              hashtags: {
                $in: [new ObjectId(hashtag_id)]
              },
              type: PostType.Post,
              is_deleted: 0
            }
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

    if (posts.length === 0) {
      return {
        posts: [],
        total: 0
      }
    } else {
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

      const hashtag = await databaseService.hashtags.findOne(new ObjectId(hashtag_id))

      return {
        posts,
        total: total[0].total,
        hashtag
      }
    }
  }
  async getDashboard() {
    const dashboard = await databaseService.posts
      .aggregate([
        {
          $match: {}
        },
        {
          $project: {
            _id: 0,
            month: {
              $month: '$created_at'
            },
            year: {
              $year: '$created_at'
            },
            type: 1
          }
        },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month',
              type: '$type'
            },
            count: {
              $sum: 1
            }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            posts_count: {
              $cond: {
                if: {
                  $eq: ['$_id.type', 0]
                },
                then: '$count',
                else: 0
              }
            },
            reposts_count: {
              $cond: {
                if: {
                  $eq: ['$_id.type', 1]
                },
                then: '$count',
                else: 0
              }
            },
            comments_count: {
              $cond: {
                if: {
                  $eq: ['$_id.type', 2]
                },
                then: '$count',
                else: 0
              }
            },
            date: {
              $concat: [
                {
                  $toString: '$_id.month'
                },
                '-',
                {
                  $toString: '$_id.year'
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month',
              date: '$date'
            },
            posts_count: {
              $sum: '$posts_count'
            },
            reposts_count: {
              $sum: '$reposts_count'
            },
            comments_count: {
              $sum: '$comments_count'
            }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            date: '$_id.date',
            posts_count: 1,
            reposts_count: 1,
            comments_count: 1
          }
        },
        {
          $sort: {
            year: 1,
            month: 1
          }
        }
      ])
      .toArray()

    return { dashboard }
  }
}

const postsService = new PostsService()
export default postsService
