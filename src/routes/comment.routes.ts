import { Router } from 'express'
import { createCommentController } from '~/controllers/comments.controller'
import { getAllHashtagsController } from '~/controllers/hashtags.controller'
import { createPostController } from '~/controllers/posts.controllers'
import { createCommentValidator } from '~/middlewares/comment.middleware'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const commentRouters = Router()

/*
Description: Create new comment
Path: /
Method: CommentRequestBody
*/
commentRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createCommentValidator,
  wrapRequestHandler(createCommentController)
)

export default commentRouters
