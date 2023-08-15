import { ObjectId } from 'mongodb'
import { UserLevelStatus, UserRoleStatus, UserVerifyStatus } from '~/constants/enums'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth?: Date
  password: string
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  role?: UserRoleStatus
  level?: UserLevelStatus
  point?: number
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
  created_at?: Date
  updated_at?: Date
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  date_of_birth: Date
  password: string
  created_at: Date
  updated_at: Date
  email_verify_token: string // jwt hoặc '' nếu đã xác thực email
  forgot_password_token: string // jwt hoặc '' nếu đã xác thực email
  verify: UserVerifyStatus // optional
  role: UserRoleStatus // optional
  level: UserLevelStatus // optional
  point: number
  bio: string // optional
  location: string // optional
  website: string // optional
  username: string // optional
  avatar: string // optional
  cover_photo: string // optional

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name
    this.email = user.email
    this.date_of_birth = user.date_of_birth || date
    this.password = user.password
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.role = user.role || UserRoleStatus.User
    this.level = user.level || UserLevelStatus.Normal
    this.point = user.point || 0
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.username = user.username || ''
    this.avatar = user.avatar || ''
    this.cover_photo = user.cover_photo || ''
  }
}
