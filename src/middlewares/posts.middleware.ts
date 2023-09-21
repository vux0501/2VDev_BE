import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { MediaType, PostType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { POSTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
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
            if ([PostType.Repost, PostType.Comment, PostType.Quotepost].includes(type) && !ObjectId.isValid(value)) {
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
          options: { min: 20, max: 500 },
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
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là Media Object
            if (
              value.some((item: any) => {
                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
              })
            ) {
              throw new Error(POSTS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
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
            const post = await databaseService.posts.findOne({
              _id: new ObjectId(value)
            })
            if (!post) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: POSTS_MESSAGES.POST_NOT_FOUND
              })
            }
          }
        }
      }
    },
    ['params', 'body']
  )
)
