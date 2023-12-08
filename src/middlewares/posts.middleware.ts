import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { MediaType, PostType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { POSTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Post from '~/models/schemas/Post.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const mediaTypes = numberEnumToArray(MediaType)
const postTypes = numberEnumToArray(PostType)

export const createPostValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [postTypes],
          errorMessage: POSTS_MESSAGES.INVALID_TYPE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as PostType
            // Nếu `type` là repost, comment, quotepost thì `parent_id` phải là `id` của post cha
            if ([PostType.Repost, PostType.Comment].includes(type) && !ObjectId.isValid(value)) {
              throw new Error(POSTS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_POST_ID)
            }
            // nếu `type` là post thì `parent_id` phải là `null`
            if (type === PostType.Post && value !== null) {
              throw new Error(POSTS_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
      title: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as PostType

            // nếu `type` là post thì `title` phải khác rỗng
            if (type === PostType.Post && value === null) {
              throw new Error(POSTS_MESSAGES.TITLE_IS_REQUIRED)
            }
            if ((type === PostType.Post && value.length < 10) || (type === PostType.Post && value.length > 255)) {
              throw new Error(POSTS_MESSAGES.TITLE_LENGTH)
            }
            return true
          }
        }
      },
      content: {
        notEmpty: {
          errorMessage: POSTS_MESSAGES.CONTENT_IS_REQUIRED
        },
        isLength: {
          options: { min: 20, max: 5000 },
          errorMessage: POSTS_MESSAGES.CONTENT_LENGTH
        },
        isString: {
          errorMessage: POSTS_MESSAGES.CONTENT_MUST_BE_A_STRING
        },
        trim: true
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là string
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new Error(POSTS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const postIdValidator = validate(
  checkSchema(
    {
      post_id: {
        isMongoId: {
          errorMessage: POSTS_MESSAGES.POST_ID_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const post = (
              await databaseService.posts
                .aggregate<Post>([
                  {
                    $match: {
                      _id: new ObjectId(value)
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
                            $in: [new ObjectId(req.decoded_authorization?.user_id), '$reports.user_id']
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
                            $in: [new ObjectId(req.decoded_authorization?.user_id), '$votes.user_id']
                          },
                          then: 1,
                          else: 0
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
                      reports: 0
                    }
                  }
                ])
                .toArray()
            )[0]
            if (!post) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: POSTS_MESSAGES.POST_NOT_FOUND
              })
            }
            ;(req as Request).post = post as any
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const getPostChildrenValidator = validate(
  checkSchema(
    {
      post_type: {
        isIn: {
          options: [postTypes],
          errorMessage: POSTS_MESSAGES.INVALID_TYPE
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num > 100 || num < 1) {
              throw new Error('1 <= limit <= 100')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new Error('page >= 1')
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)

export const updatePostValidator = validate(
  checkSchema(
    {
      title: {
        optional: true,
        isString: {
          errorMessage: POSTS_MESSAGES.TITLE_IS_REQUIRED
        },
        trim: true,
        isLength: {
          options: {
            min: 10,
            max: 50
          },
          errorMessage: POSTS_MESSAGES.TITLE_LENGTH
        }
      },
      content: {
        optional: true,
        isString: {
          errorMessage: POSTS_MESSAGES.CONTENT_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 50,
            max: 5000
          },
          errorMessage: POSTS_MESSAGES.CONTENT_LENGTH
        }
      }
    },
    ['body']
  )
)
