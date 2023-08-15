import { Router } from 'express'
import { registerController } from '~/controllers/users.controllers'
import { registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouters = Router()

/*
Description: Register
Path: /register
Method: POST
Body: {name: String, email: String, password: String, confirmPassword: String, date_of_birth: ISO8601}
*/
userRouters.post('/register', registerValidator, wrapRequestHandler(registerController))
export default userRouters
