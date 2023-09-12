import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { MediaType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { POSTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const mediaTypes = numberEnumToArray(MediaType)

export const createPostValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: {
          errorMessage: POSTS_MESSAGES.TITLE_IS_REQUIRED
        },
        isLength: {
          options: { min: 20, max: 50 },
          errorMessage: POSTS_MESSAGES.TITLE_LENGTH
        },
        isString: {
          errorMessage: POSTS_MESSAGES.TITLE_MUST_BE_A_STRING
        },
        trim: true
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
