import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const mediaRouters = Router()

/**
 * Description: Upload iamge
 * Path: /medias/upload-image
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
mediaRouters.post('/upload-image', wrapRequestHandler(uploadImageController))

export default mediaRouters
