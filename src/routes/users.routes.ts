import { Router } from 'express'
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getDataController,
  getListUsersController,
  getListUsersFollowerController,
  getListUsersFollowingController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oauthController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateAccountController,
  updateMeController,
  updatePointController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middleware'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  isAdminValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateAccountValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateAccountReqBody, UpdateMeReqBody } from '~/models/requests/User.request'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouters = Router()

/*
Description: Register
Path: /register
Method: POST
Body: {email: String, password: String}
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
Path: /logout
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

/*
Description: Submit email to reset password, send email to user
Path: /forgot-password
Method: POST
Body: {email: string}
*/
userRouters.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description. Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: POST
 * Body: {forgot_password_token: string}
 */
userRouters.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description: Reset password
 * Path: /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
userRouters.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description: Get my profile
 * Path: /me
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description: Get data
 * Path: /data
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.get('/data', wrapRequestHandler(getDataController))

/**
 * Description: Update my profile
 * Path: /me
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: UserSchema
 */
userRouters.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description: Get all user
 * Path: /list-users?limit={limit}&page={page}&sort_field={sort_field}&sort_value={sort_value}
 * Method: GET
 */
userRouters.get('/list-users', accessTokenValidator, wrapRequestHandler(getListUsersController))

/**
 * Description: Get user profile
 * Path: /:username
 * Header: { Authorization: Bearer <access_token> }
 * Method: GET

 */
userRouters.get('/:username', accessTokenValidator, wrapRequestHandler(getProfileController))

/**
 * Description: Change password
 * Path: /change-password
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 * Body: { old_password: string, new_password: string, confirm_new_password: string }
 */
userRouters.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

/**
 * Description. OAuth with Google
 * Path: /oauth/google
 * Method: GET
 * Query: { code: string }
 */
userRouters.get('/oauth/google', wrapRequestHandler(oauthController))

//for admin

/**
 * Description: Update profile - admin
 * Path: /update-account/:user_id
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: UserSchema
 */
userRouters.patch(
  '/update-account/:user_id',
  accessTokenValidator,
  isAdminValidator,
  updateAccountValidator,
  filterMiddleware<UpdateAccountReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo',
    'verify',
    'role'
  ]),
  wrapRequestHandler(updateAccountController)
)

/**
 * Description: Follow someone
 * Path: /follow
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { followed_user_id: string }
 */
userRouters.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description: Follow someone
 * Path: /follow/user_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: Get following
 * Path: /followers/list-users-following/:user_id?limit={limit}&page={page}
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.get(
  '/followers/list-users-following/:user_id',
  accessTokenValidator,
  wrapRequestHandler(getListUsersFollowingController)
)

/**
 * Description: Get follower
 * Path: /followers/list-users-follower/user_id?limit={limit}&page={page}
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.get(
  '/followers/list-users-follower/:user_id',
  accessTokenValidator,
  wrapRequestHandler(getListUsersFollowerController)
)

/**
 * Description: Update point
 * Path: /update-point
 * Method: POST
 * Body: {user_id: string, point: number}
 */
userRouters.post('/update-point', wrapRequestHandler(updatePointController))

export default userRouters
