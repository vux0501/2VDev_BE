import { Request, Response, NextFunction } from 'express'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  GetProfileReqParams,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnfollowReqParams,
  UpdateAccountReqBody,
  UpdateMeReqBody,
  UpdatePointReqBody,
  VerifyEmailReqBody,
  VerifyForgotPasswordReqBody
} from '~/models/requests/User.request'
import { ParamsDictionary } from 'express-serve-static-core'
import { USERS_MESSAGES } from '~/constants/messages'
import usersService from '~/services/users.services'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { Console } from 'console'
import { envConfig } from '~/constants/config'

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify,
    role: user.role
  })
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // nếu không tìm thấy user
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  //đã verify rồi thì không báo lỗi, trả về status OK, message: đã verify
  if (user.email_verify_token === '') {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY
    })
  }
  //nếu chưa verify
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY
    })
  }
  const result = await usersService.resendVerifyEmail(user_id, user.email)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify, role, exp } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ user_id, refresh_token, verify, role, exp })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, verify, role, email } = req.user as User
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify,
    role,
    email
  })
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(user_id, password)
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const getDataController = async (req: Request, res: Response, next: NextFunction) => {
  const { users, questions, answers, bestAnswers } = await usersService.getData()
  return res.json({
    message: 'Get data successfully!',
    result: { users, questions, answers, bestAnswers }
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  const user = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
}

export const updateAccountController = async (
  req: Request<ParamsDictionary, any, UpdateAccountReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.params
  const { body } = req
  const user = await usersService.updateAccount(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getProfile(user_id, username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}

export const getListUsersController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const sort_field = req.query.sort_field as string
  const sort_value = Number(req.query.sort_value)
  const list_user = await usersService.getListUsers({ user_id, limit, page, sort_field, sort_value })
  return res.json({
    message: USERS_MESSAGES.GET_LIST_USER_SUCCESS,
    result: list_user
  })
}

export const getListUsersFollowingController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id: current_user_id } = req.decoded_authorization as TokenPayload
  const user_id = req.params.user_id as string

  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { list_users_following, totalPage, totalUser, currentPage, userPerPage } =
    await usersService.getListUsersFollowing({
      current_user_id,
      user_id,
      limit,
      page
    })
  return res.json({
    message: USERS_MESSAGES.GET_LIST_USER_SUCCESS,
    result: list_users_following,
    totalPage,
    totalUser,
    currentPage,
    userPerPage
  })
}

export const getListUsersFollowerController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id: current_user_id } = req.decoded_authorization as TokenPayload

  const user_id = req.params.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { list_users_following, totalPage, totalUser, currentPage, userPerPage } =
    await usersService.getListUsersFollower({
      current_user_id,
      user_id,
      limit,
      page
    })
  return res.json({
    message: USERS_MESSAGES.GET_LIST_USER_SUCCESS,
    result: list_users_following,
    totalPage,
    totalUser,
    currentPage,
    userPerPage
  })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query

  const result = await usersService.oauth(code as string)
  const urlRedirect = `${envConfig.clientRedirectCallback}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}&role=${result.role}`
  return res.redirect(urlRedirect)
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollow(user_id, followed_user_id)
  return res.json(result)
}

export const updatePointController = async (req: Request<UpdatePointReqBody>, res: Response, next: NextFunction) => {
  const { user_id, point } = req.body
  const result = await usersService.updatePoint(user_id, point)
  return res.json(result)
}
