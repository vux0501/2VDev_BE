import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserLevelStatus, UserRoleStatus, UserVerifyStatus } from '~/constants/enums'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
}
export interface LoginReqBody {
  email: string
  password: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  role: UserRoleStatus
  level: UserLevelStatus
  exp: number
  iat: number
}
