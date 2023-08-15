import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
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

export default userRouters
