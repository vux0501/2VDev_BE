import { PostRequestBody, UpdatePostReqBody } from '~/models/requests/Post.request'
import databaseService from './database.services'
import Post from '~/models/schemas/Post.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { PostType } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'
import { POSTS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'

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
            type: post_type
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
                    $eq: ['$$item.type', PostType.Comment]
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
              type: PostType.Post
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
                      $eq: ['$$item.type', PostType.Repost]
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
              user_id: new ObjectId(user_id)
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
                      $eq: ['$$item.type', PostType.Repost]
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
              type: PostType.Post
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
                      $eq: ['$$item.type', PostType.Repost]
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
              type: PostType.Post
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
                      $eq: ['$$item.type', PostType.Repost]
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
    await databaseService.posts.findOneAndDelete({
      user_id: new ObjectId(user_id),
      _id: new ObjectId(post_id)
    })

    await databaseService.posts.deleteMany({
      parent_id: new ObjectId(post_id)
    })
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
              type: 0
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
                      $eq: ['$$item.type', PostType.Repost]
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
}

const postsService = new PostsService()
export default postsService
