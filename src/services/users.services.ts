import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateAccountReqBody, UpdateMeReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { NotificationType, TokenType, UserRoleStatus, UserVerifyStatus } from '~/constants/enums'

import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { sendForgotPasswordEmail, sendVerifyRegisterEmail } from '~/utils/email'
import axios from 'axios'
import Follower from '~/models/schemas/Follower.schema'
import { envConfig } from '~/constants/config'
import Notification from '~/models/schemas/Notification.schema'

class UsersService {
  private signAccessToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify,
        role
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    })
  }
  private signRefreshToken({
    user_id,
    verify,
    role,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    exp?: number
  }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          role,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
        role
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn
      }
    })
  }
  private signEmailVerifyToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify,
        role
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken,
      options: {
        expiresIn: envConfig.emailVerifyTokenExpiresIn
      }
    })
  }

  private signForgotPasswordToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify,
        role
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken,
      options: {
        expiresIn: envConfig.forgotPasswordTokenExpiresIn
      }
    })
  }

  private signAccessAndRefreshToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
  }) {
    return Promise.all([
      this.signAccessToken({ user_id, verify, role }),
      this.signRefreshToken({ user_id, verify, role })
    ])
  }
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: envConfig.jwtSecretRefreshToken
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: UserRoleStatus.User
    })

    try {
      console.log(`Verify Email Token : ${email_verify_token}`)
      await sendVerifyRegisterEmail(payload.email, email_verify_token)
    } catch (error) {
      throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message: USERS_MESSAGES.CANNOT_SEND_VERIFY_EMAIL })
    }

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        username: `user${user_id.toString().substring(0, 8)}`,
        email_verify_token,
        password: hashPassword(payload.password),
        avatar: 'https://res.cloudinary.com/dozeyxrdy/image/upload/v1692167930/2VDev-logo_cenlul.png',
        cover_photo: 'https://res.cloudinary.com/dozeyxrdy/image/upload/v1692632216/2VTech_kzwteh.png'
      })
    )

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
      role: UserRoleStatus.User
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

  async login({ user_id, verify, role }: { user_id: string; verify: UserVerifyStatus; role: UserRoleStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role
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
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({
        user_id,
        verify: UserVerifyStatus.Verified,
        role: UserRoleStatus.User
      }),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: '$$NOW'
          }
        }
      ])
    ])
    const [access_token, refresh_token] = token
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified,
      role: UserRoleStatus.User
    })

    try {
      console.log(`Verify Email Token : ${email_verify_token}`)
      await sendVerifyRegisterEmail(email, email_verify_token)
    } catch (error) {
      throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message: USERS_MESSAGES.CANNOT_SEND_VERIFY_EMAIL })
    }

    // Cập nhật lại giá trị email_verify_token trong document user
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
  async refreshToken({
    user_id,
    verify,
    role,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    role: UserRoleStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify, role }),
      this.signRefreshToken({ user_id, verify, role, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  async forgotPassword({
    user_id,
    verify,
    role,
    email
  }: {
    user_id: string
    email: string
    verify: UserVerifyStatus
    role: UserRoleStatus
  }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify,
      role
    })
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    await sendForgotPasswordEmail(email, forgot_password_token)

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = (
      await databaseService.users
        .aggregate([
          {
            $match: {
              _id: new ObjectId(user_id)
            }
          },
          {
            $lookup: {
              from: 'posts',
              let: {
                userId: '$_id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$user_id', '$$userId']
                        },
                        {
                          $eq: ['$type', 0]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'questions'
            }
          },
          {
            $lookup: {
              from: 'posts',
              let: {
                userId: '$_id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$user_id', '$$userId']
                        },
                        {
                          $eq: ['$type', 2]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'answers'
            }
          },
          {
            $lookup: {
              from: 'followers',
              localField: '_id',
              foreignField: 'user_id',
              as: 'following'
            }
          },
          {
            $lookup: {
              from: 'followers',
              localField: '_id',
              foreignField: 'followed_user_id',
              as: 'followers'
            }
          },
          {
            $addFields: {
              following: {
                $size: '$following'
              },
              followers: {
                $size: '$followers'
              },
              questions: {
                $size: '$questions'
              },
              answers: {
                $size: '$answers'
              }
            }
          },
          {
            $project: {
              password: 0,
              forgot_password_token: 0,
              email_verify_token: 0
            }
          }
        ])
        .toArray()
    )[0]

    return user
  }

  async getData() {
    const [users, questions, answers, bestAnswers] = await Promise.all([
      databaseService.users.countDocuments({}),
      databaseService.posts.countDocuments({ type: 0, is_deleted: 0 }),
      databaseService.posts.countDocuments({ type: 2, is_deleted: 0 }),
      databaseService.posts.countDocuments({ resolved_id: { $ne: null }, is_deleted: 0 })
    ])

    return { users, questions, answers, bestAnswers }
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return this.getMe(user_id)
  }

  async updateAccount(user_id: string, payload: UpdateAccountReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_payload as UpdateAccountReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user.value
  }

  async getProfile(user_id: string, username: string) {
    const user = (
      await databaseService.users
        .aggregate([
          {
            $match: {
              username: username
            }
          },
          {
            $lookup: {
              from: 'posts',
              let: {
                userId: '$_id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$user_id', '$$userId']
                        },
                        {
                          $eq: ['$type', 0]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'questions'
            }
          },
          {
            $lookup: {
              from: 'posts',
              let: {
                userId: '$_id'
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ['$user_id', '$$userId']
                        },
                        {
                          $eq: ['$type', 2]
                        }
                      ]
                    }
                  }
                }
              ],
              as: 'answers'
            }
          },
          {
            $lookup: {
              from: 'followers',
              localField: '_id',
              foreignField: 'user_id',
              as: 'following'
            }
          },
          {
            $lookup: {
              from: 'followers',
              localField: '_id',
              foreignField: 'followed_user_id',
              as: 'followers'
            }
          },
          {
            $addFields: {
              following: {
                $size: '$following'
              },
              followers: {
                $size: '$followers'
              },
              questions: {
                $size: '$questions'
              },
              answers: {
                $size: '$answers'
              },
              is_followed: {
                $cond: {
                  if: {
                    $in: [new ObjectId(user_id), '$followers.user_id']
                  },
                  then: 1,
                  else: 0
                }
              }
            }
          },
          {
            $project: {
              password: 0,
              forgot_password_token: 0,
              email_verify_token: 0
            }
          }
        ])
        .toArray()
    )[0]
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async getListUsers({
    user_id,
    limit,
    page,
    sort_field,
    sort_value
  }: {
    user_id: string
    limit: number
    page: number
    sort_field: string
    sort_value: number
  }) {
    const list_users = await databaseService.users
      .aggregate([
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'user_id',
            as: 'following'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'followed_user_id',
            as: 'followers'
          }
        },
        {
          $addFields: {
            following: {
              $size: '$following'
            },
            followers: {
              $size: '$followers'
            },
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(user_id), '$followers.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            password: 0,
            forgot_password_token: 0,
            email_verify_token: 0
          }
        },
        {
          $sort: {
            [sort_field]: sort_value
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const totalUser = await databaseService.users.countDocuments()
    const totalPage = Math.ceil(totalUser / limit)

    if (list_users === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.LIST_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { list_users, currentPage: page, userPerPage: limit, totalUser: totalUser, totalPage: totalPage }
  }

  async getListUsersFollowing({
    current_user_id,
    user_id,
    limit,
    page
  }: {
    current_user_id: string
    user_id: string
    limit: number
    page: number
  }) {
    const list_users_following = await databaseService.followers
      .aggregate([
        {
          $match: {
            user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'followed_user_id',
            foreignField: '_id',
            as: 'user_following_detail'
          }
        },
        {
          $addFields: {
            user_following_detail: {
              $map: {
                input: '$user_following_detail',
                as: 'item',
                in: {
                  _id: '$$item._id',
                  name: '$$item.name',
                  username: '$$item.username',
                  avatar: '$$item.avatar',
                  point: '$$item.point'
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$user_following_detail'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: 'user_following_detail._id',
            foreignField: 'followed_user_id',
            as: 'result'
          }
        },
        {
          $addFields: {
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(current_user_id), '$result.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            user_following_detail: 1,
            _id: 0,
            is_followed: 1
          }
        },
        {
          $sort: {
            is_followed: -1
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const listAll = await databaseService.followers
      .aggregate([
        {
          $match: {
            user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'followed_user_id',
            foreignField: '_id',
            as: 'user_following_detail'
          }
        },
        {
          $addFields: {
            user_following_detail: {
              $map: {
                input: '$user_following_detail',
                as: 'item',
                in: {
                  _id: '$$item._id',
                  name: '$$item.name',
                  username: '$$item.username',
                  avatar: '$$item.avatar',
                  point: '$$item.point'
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$user_following_detail'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: 'user_following_detail._id',
            foreignField: 'followed_user_id',
            as: 'result'
          }
        },
        {
          $addFields: {
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(current_user_id), '$result.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            user_following_detail: 1,
            _id: 0,
            is_followed: 1
          }
        },
        {
          $sort: {
            is_followed: -1
          }
        }
      ])
      .toArray()

    const totalUser = await listAll.length
    const totalPage = Math.ceil(totalUser / limit)

    if (list_users_following === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.LIST_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { list_users_following, currentPage: page, userPerPage: limit, totalUser: totalUser, totalPage: totalPage }
  }

  async getListUsersFollower({
    current_user_id,
    user_id,
    limit,
    page
  }: {
    current_user_id: string
    user_id: string
    limit: number
    page: number
  }) {
    const list_users_following = await databaseService.followers
      .aggregate([
        {
          $match: {
            followed_user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_follower_detail'
          }
        },
        {
          $addFields: {
            user_follower_detail: {
              $map: {
                input: '$user_follower_detail',
                as: 'item',
                in: {
                  _id: '$$item._id',
                  name: '$$item.name',
                  username: '$$item.username',
                  avatar: '$$item.avatar',
                  point: '$$item.point'
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$user_follower_detail'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: 'user_follower_detail._id',
            foreignField: 'followed_user_id',
            as: 'result'
          }
        },
        {
          $addFields: {
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(current_user_id), '$result.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            user_follower_detail: 1,
            _id: 0,
            is_followed: 1
          }
        },
        {
          $sort: {
            is_followed: -1
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    const listAll = await databaseService.followers
      .aggregate([
        {
          $match: {
            followed_user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_follower_detail'
          }
        },
        {
          $addFields: {
            user_follower_detail: {
              $map: {
                input: '$user_follower_detail',
                as: 'item',
                in: {
                  _id: '$$item._id',
                  name: '$$item.name',
                  username: '$$item.username',
                  avatar: '$$item.avatar',
                  point: '$$item.point'
                }
              }
            }
          }
        },
        {
          $unwind: {
            path: '$user_follower_detail'
          }
        },
        {
          $lookup: {
            from: 'followers',
            localField: 'user_follower_detail._id',
            foreignField: 'followed_user_id',
            as: 'result'
          }
        },
        {
          $addFields: {
            is_followed: {
              $cond: {
                if: {
                  $in: [new ObjectId(current_user_id), '$result.user_id']
                },
                then: 1,
                else: 0
              }
            }
          }
        },
        {
          $project: {
            user_follower_detail: 1,
            _id: 0,
            is_followed: 1
          }
        }
      ])
      .toArray()

    const totalUser = await listAll.length
    const totalPage = Math.ceil(totalUser / limit)

    if (list_users_following === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.LIST_USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return { list_users_following, currentPage: page, userPerPage: limit, totalUser: totalUser, totalPage: totalPage }
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    // Kiểm tra gmail này đã dùng để đăng ký tài khoản hay chưa?
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // Nếu tồn tại thì cho login vào
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify,
        role: user.role
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: user._id, token: refresh_token, iat, exp })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify,
        role: user.role
      }
    } else {
      // Tạo mật khẩu ngẫu nhiên cho user mới, nếu muốn cập nhập mật khẩu thì sử dụng chứ năng "Quên mật khẩu"
      const password = Math.random().toString(36).substring(2, 15)
      // không thì đăng ký
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        password,
        confirm_password: password
      })
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified, role: UserRoleStatus }
    }
  }
  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      await databaseService.notifications.insertOne(
        new Notification({
          direct_id: new ObjectId(user_id),
          sender_id: new ObjectId(user_id),
          receiver_id: new ObjectId(followed_user_id),
          type: NotificationType.Follow
        })
      )
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // Không tìm thấy document follower
    // nghĩa là chưa follow người này
    if (follower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    // Tìm thấy document follower
    // Nghĩa là đã follow người này rồi, thì ta tiến hành xóa document này
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
  }

  async updatePoint(user_id: string, point: number) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })

    if (!user) {
      throw new ErrorWithStatus({
        status: 404,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    const old_score = user.point

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: { point: old_score + point }
      }
    )
    return {
      message: USERS_MESSAGES.UPDATE_POINT_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
