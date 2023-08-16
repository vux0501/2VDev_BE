import { Router } from 'express'
import {
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  verifyEmailController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouters = Router()

/*
Description: Register
Path: /register
Method: POST
Body: {name: String, email: String, password: String, confirmPassword: String, date_of_birth: ISO8601}
*/
userRouters.post('/register', registerValidator, wrapRequestHandler(registerController))

/*
Description: Login
Path: /login
Method: POST
Body: {email: String, password: String}
*/
userRouters.post('/login', loginValidator, wrapRequestHandler(loginController))

/*
Description: Logout
Path: /Logout
Method: POST
Body: {refresh_token: string}
*/
userRouters.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/*
Description: Verify Email
Path: /verify-email
Method: POST
Body: {verify_email_token: string}
*/
userRouters.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))

/**
 * Description: Resend Verify Email
 * Path: /resend-verify-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {}
 */
userRouters.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/*
Description: Refresh Token
Path: /refresh-token
Method: POST
Header: {Authorization: Bearer <access_token>}
Body: {refresh_token: string}
*/
userRouters.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

export default userRouters
