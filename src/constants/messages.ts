export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required.',
  NAME_MUST_BE_A_STRING: 'Name must be a string.',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_ALREADY_EXISTS: 'Email already exists.',
  EMAIL_IS_REQUIRED: 'Email is required.',
  EMAIL_IS_INVALID: 'Email is invalid.',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect.',
  PASSWORD_IS_REQUIRED: 'Password is required.',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string.',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm Password is required.',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm Password must be a string.',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm Password length must be from 6 to 50',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm Password must be the same as Password.',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601.',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password incorrect.',
  INVALID_USER_ID: 'user_id invalid.',

  LOGIN_SUCCESS: 'Login success.',
  REGISTER_SUCCESS: 'Register success.',
  ACCESS_TOKEN_IS_REQUIRED: 'Access Token is required.',
  ACCESS_TOKEN_INVALID: 'Access Token invalid.',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh Token is required.',
  REFRESH_TOKEN_INVALID: 'Refresh Token is invalid.',
  REFRESH_TOKEN_SUCCESS: 'Refresh Token success.',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
  LOGOUT_SUCCESS: 'Log out success.',
  VERIFY_EMAIL_TOKEN_IS_REQUIRED: 'Verify email token is required.',
  USER_NOT_FOUND: 'User not found.',
  EMAIL_ALREADY_VERIFY: 'Email already verify.',
  EMAIL_VERIFY_SUCCESS: 'Verify email success.',
  RESEND_VERIFY_EMAIL_SUCCESS: 'resend verify email success.',
  CANNOT_SEND_VERIFY_EMAIL: 'Cannot send verify email.',

  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password.',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required.',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Forgot password token invalid.',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  RESET_PASSWORD_SUCCESS: 'Reset password success.',

  GET_ME_SUCCESS: 'Get me success.',
  USER_NOT_VERIFIED: 'User not verified.',
  NOT_ADMIN: 'Only admin accounts are allowed to use this function.',
  IMAGE_URL_MUST_BE_STRING: 'The image URL must be a string.',
  IMAGE_URL_LENGTH: 'The image URL length invalid',
  BIO_MUST_BE_STRING: 'Bio must be a string.',
  BIO_LENGTH: 'Bio length must be from 1 to 200.',
  LOCATION_MUST_BE_STRING: 'Location must be a string.',
  LOCATION_LENGTH: 'Location length must be from 1 to 200.',
  WEBSITE_MUST_BE_STRING: 'Website must be a string.',
  WEBSITE_LENGTH: 'Website length must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'Username must be a string.',
  USERNAME_INVALID:
    'The username must contain 4-12 characters, including both letters and numbers (special characters such as underscore are allowed). Example: user01, user_01.',
  USERNAME_EXISTED: 'Username existed.',
  UPDATE_ME_SUCCESS: 'Update me success.',

  GET_PROFILE_SUCCESS: 'Get profile success.',
  GET_LIST_USER_SUCCESS: 'Get list user success.',
  LIST_USER_NOT_FOUND: 'List user not found.',

  OLD_PASSWORD_NOT_MATCH: 'Old password is not match.',
  CHANGE_PASSWORD_SUCCESS: 'Change password success.',
  PARAMS_NOT_FOUND: 'Params not found',

  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  UPLOAD_SUCCESS: 'Upload success.',

  FOLLOW_SUCCESS: 'Follow success',
  FOLLOWED: 'Already follow.',
  ALREADY_UNFOLLOWED: 'Already unfollow.',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  UPDATE_POINT_SUCCESS: 'Update point success.'
} as const

export const POSTS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Post is not found',
  TITLE_IS_REQUIRED: 'Title is required.',
  TITLE_LENGTH: 'Title length must be from 10 to 50.',

  CONTENT_IS_REQUIRED: 'Content is required.',
  CONTENT_LENGTH: 'CONTENT length must be from 50 to 5000.',
  CONTENT_MUST_BE_A_STRING: 'Content must be a string.',

  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtag must be an array of string.',

  POST_ID_INVALID: 'Id post is invalid.',
  POST_NOT_FOUND: 'Post is not found.',
  INVALID_TYPE: 'Type Post is not found',

  PARENT_ID_MUST_BE_A_VALID_POST_ID: 'parent_id must be a valid post_id',
  PARENT_ID_MUST_BE_NULL: 'parent_id must be null',

  PARENT_ID_MUST_BE_STRING: 'parent_id must be a string',

  DELETE_POST_SUCCESS: 'Delete post success',
  UPDATE_POST_SUCCESS: 'Update post success',
  RESOLVE_POST_SUCCESS: 'Resolve post success'
} as const

export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESSFULLY: 'Bookmark success',
  GET_BOOKMARK_SUCCESSFULLY: 'Get bookmark success',
  UNBOOKMARK_SUCCESSFULLY: 'Unbookmark success'
}

export const VOTE_MESSAGES = {
  VOTE_SUCCESSFULLY: 'Vote success',
  UNVOTE_SUCCESSFULLY: 'Unvote success'
}

export const REPORT_MESSAGES = {
  REPORT_SUCCESSFULLY: 'Report success',
  UNREPORT_SUCCESSFULLY: 'Unreport success'
}
