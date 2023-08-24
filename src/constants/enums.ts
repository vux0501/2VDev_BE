export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum UserLevelStatus {
  Normal, // tài khoản thường, mặc định = 0
  Master // tài khoản tích xanh
}

export enum UserRoleStatus {
  User, // tào khoản người dùng, mặc định = 0
  Admin // tài khoản admin
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video
}
