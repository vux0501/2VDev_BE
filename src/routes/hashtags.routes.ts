import { Router } from 'express'
import { getAllHashtagsController } from '~/controllers/hashtags.controller'
import { createPostController } from '~/controllers/posts.controllers'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const hashtagRouters = Router()

/*
Description: Get all hashtags with count
Path: /
Method: get
*/
hashtagRouters.get('/get', wrapRequestHandler(getAllHashtagsController))

export default hashtagRouters
