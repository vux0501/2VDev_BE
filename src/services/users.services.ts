import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserLevelStatus, UserRoleStatus, UserVerifyStatus } from '~/constants/enums'
import dotenv from 'dotenv'

import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/requests/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'

dotenv.config()

class UsersService {
  private signAccessToken({
    user_id,
    verify,
    role,
    level
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    level: UserLevelStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify,
        role,
        level
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken({
    user_id,
    verify,
    role,
    level,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    level: UserLevelStatus
    exp?: number
  }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          role,
          level,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
        role,
        level
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signEmailVerifyToken({
    user_id,
    verify,
    role,
    level
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    level: UserLevelStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify,
        role,
        level
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  /*sign forgot password token*/

  private signAccessAndRefreshToken({
    user_id,
    verify,
    role,
    level
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    level: UserLevelStatus
  }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify, role, level }),
      this.signRefreshToken({ user_id, verify, role, level })
    ])
  }
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: UserRoleStatus.User,
      level: UserLevelStatus.Normal
    })

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        password: hashPassword(payload.password)
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: UserRoleStatus.User,
      level: UserLevelStatus.Normal
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login({
    user_id,
    verify,
    role,
    level
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    level: UserLevelStatus
  }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role,
      level
    })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
