export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
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

export enum PostType {
  Post,
  Repost,
  Comment
}

export enum NotificationType {
  VotePost,
  VoteRepost,
  VoteComment,
  Comment,
  Repost,
  Pin,
  Bookmark,
  Follow
}

export enum ResolvedType {
  unResolved,
  Resolved
}

export enum ChoosedType {
  unChoosed,
  Choosed
}
