import { Router } from 'express'
import { createCommentController, getAllCommentOfPost } from '~/controllers/comments.controllers'
import { getAllHashtagsController } from '~/controllers/hashtags.controllers'
import { createPostController } from '~/controllers/posts.controllers'
import { createCommentValidator } from '~/middlewares/comment.middleware'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const commentRouters = Router()

/*
Description: Create new comment
Path: /
Method: POST
Body: CommentRequestBody
*/
commentRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createCommentValidator,
  wrapRequestHandler(createCommentController)
)

/*
Description: Get all comment of post
Path: /get/:post_id
Method: GET
Body: None
*/
commentRouters.get('/get/:post_id', wrapRequestHandler(getAllCommentOfPost))

export default commentRouters
