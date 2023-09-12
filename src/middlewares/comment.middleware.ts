import { checkSchema } from 'express-validator'
import { MediaType } from '~/constants/enums'
import { COMMENTS_MESSAGE, POSTS_MESSAGES } from '~/constants/messages'
import { numberEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const mediaTypes = numberEnumToArray(MediaType)

export const createCommentValidator = validate(
  checkSchema(
    {
      content: {
        notEmpty: {
          errorMessage: COMMENTS_MESSAGE.COMMENT_IS_REQUIRED
        },
        isLength: {
          options: { min: 20, max: 255 },
          errorMessage: COMMENTS_MESSAGE.COMMENT_LENGTH
        },
        isString: {
          errorMessage: COMMENTS_MESSAGE.COMMENT_MUST_BE_A_STRING
        },
        trim: true
      },
      post_id: {
        notEmpty: {
          errorMessage: COMMENTS_MESSAGE.POSTID_IS_REQUIRED
        },
        isString: {
          errorMessage: COMMENTS_MESSAGE.POSTID_MUST_BE_A_STRING
        },
        trim: true
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
