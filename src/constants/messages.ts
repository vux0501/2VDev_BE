export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Tên không được để trống.',
  NAME_MUST_BE_A_STRING: 'Tên phải là chuỗi.',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Tên chỉ chứa 1 đến 100 ký tự',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại.',
  EMAIL_IS_REQUIRED: 'Email không được để trống.',
  EMAIL_IS_INVALID: 'Email không đúng định dạng.',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email hoặc mật khẩu không chính xác.',
  PASSWORD_IS_REQUIRED: 'Mật khẩu không được để trống.',
  PASSWORD_MUST_BE_A_STRING: 'Mật khẩu phải là chuỗi.',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password chỉ chứa 6 đến 50 ký tự',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm Password không được để trống.',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm Password phải là chuỗi.',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm Password chỉ chứa 6 đến 50 ký tự.',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Mật khẩu xác nhận không khớp.',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Ngày sinh phải có dạng ISO8601.',
  EMAIL_OR_PASSWORD_INCORRECT: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
  INVALID_USER_ID: 'user_id không đúng',

  LOGIN_SUCCESS: 'Đăng nhập thành công.',
  REGISTER_SUCCESS: 'Đăng ký thành công.',
  ACCESS_TOKEN_IS_REQUIRED: 'Access Token không được trống.',
  ACCESS_TOKEN_INVALID: 'Access Token không đúng hoặc đã hết hạn.',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh Token không được trống.',
  REFRESH_TOKEN_INVALID: 'Không đúng định dạng.',
  REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công.',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Refresh Token đã được sử dụng hoặc không tồn tại trong database',
  LOGOUT_SUCCESS: 'Đăng xuất thành công.',
  VERIFY_EMAIL_TOKEN_IS_REQUIRED: 'Verify email token không được trống.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',
  EMAIL_ALREADY_VERIFY: 'Email đã được xác thực trước đó.',
  EMAIL_VERIFY_SUCCESS: 'Xác thực email thành công.',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Đã gửi lại email xác thực.',
  CANNOT_SEND_VERIFY_EMAIL: 'Không thể gửi email xác thực do email không tồn tại.',

  CHECK_EMAIL_TO_RESET_PASSWORD: 'Kiểm tra hòm thư email để lấy lại mật khẩu.',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token không được để trống.',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Forgot password token không hợp lệ.',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Xác thực Forgot password token thành công',
  RESET_PASSWORD_SUCCESS: 'Reset mật khẩu thành công.',

  GET_ME_SUCCESS: 'Lấy thông tin tài khoản hiện tại thành công.',
  USER_NOT_VERIFIED: 'Tài khoản chưa được xác thực.',
  NOT_ADMIN: 'Chỉ tài khoản admin mới được sử dụng chức năng này.',
  IMAGE_URL_MUST_BE_STRING: 'Link hình ảnh không hợp lệ.',
  IMAGE_URL_LENGTH: 'Kích thước link hình ảnh không hợp lệ',
  BIO_MUST_BE_STRING: 'Bio phải là chuỗi.',
  BIO_LENGTH: 'Bio chỉ được chứa 1-200 ký tự.',
  LOCATION_MUST_BE_STRING: 'Địa chỉ phải là chuỗi.',
  LOCATION_LENGTH: 'Địa chỉ chỉ được chứa 1-200 ký tự.',
  WEBSITE_MUST_BE_STRING: 'Website phải là chuỗi.',
  WEBSITE_LENGTH: 'Website chỉ được chứa 1-200 ký tự',
  USERNAME_MUST_BE_STRING: 'Username phải là chuỗi.',
  USERNAME_INVALID:
    'Username phải chứa 4-12 ký tự chứa cả chữ, số (có thể sử dụng ký tự đặc biệt là dấu shift gạch). Ex: user01, user_01',
  USERNAME_EXISTED: 'Username đã tồn tại.',
  UPDATE_ME_SUCCESS: 'Cập nhập thông tin cá nhân thành công.',

  GET_PROFILE_SUCCESS: 'Lấy thông tin user thành công.',
  GET_LIST_USER_SUCCESS: 'Lấy thông tin tất cả user thành công.',
  LIST_USER_NOT_FOUND: 'Danh sách user trống.',

  OLD_PASSWORD_NOT_MATCH: 'Mật khẩu cũ không chính xác.',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công.',
  PARAMS_NOT_FOUND: 'Không tìm thấy params',

  GMAIL_NOT_VERIFIED: 'Gmail chưa được xác thực',
  UPLOAD_SUCCESS: 'Upload thành công.',

  FOLLOW_SUCCESS: 'Follow thành công',
  FOLLOWED: 'Đã follow rồi người ngày rồi.',
  ALREADY_UNFOLLOWED: 'Đã unfollow người này rồi.',
  UNFOLLOW_SUCCESS: 'Unfollow thành công',
  UPDATE_POINT_SUCCESS: 'Cập nhập điểm thành công.'
} as const

export const POSTS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Không có bài viết nào',
  TITLE_IS_REQUIRED: 'Tiêu đề của bài viết gốc không được rỗng.',
  TITLE_LENGTH: 'Tiêu đề của bài viết từ 10 đến 50 ký tự.',

  CONTENT_IS_REQUIRED: 'Nội dung không được để trống.',
  CONTENT_LENGTH: 'Nội dung phải từ 20 đến 5000 ký tự.',
  CONTENT_MUST_BE_A_STRING: 'Nội dung phải là chuỗi ký tự.',

  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtag phải là một mảng chuỗi ký tự.',

  POST_ID_INVALID: 'Id post không đúng định dạng.',
  POST_NOT_FOUND: 'Không tìm thấy bài post này.',
  INVALID_TYPE: 'Kiểu của bài viết không đúng',

  PARENT_ID_MUST_BE_A_VALID_POST_ID: 'parent_id phải là id của bài viết cha',
  PARENT_ID_MUST_BE_NULL: 'Bài viết gốc nên parent_id phải là null',

  PARENT_ID_MUST_BE_STRING: 'parent_id phải là string',

  DELETE_POST_SUCCESS: 'Xóa thành công',
  UPDATE_POST_SUCCESS: 'Cập nhập thành công',
  RESOLVE_POST_SUCCESS: 'Ghim câu trả lời đúng thành công'
} as const

export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESSFULLY: 'bookmark thành công',
  GET_BOOKMARK_SUCCESSFULLY: 'get bookmark thành công',
  UNBOOKMARK_SUCCESSFULLY: 'Unbookmark thành công'
}

export const VOTE_MESSAGES = {
  VOTE_SUCCESSFULLY: 'Vote thành công',
  UNVOTE_SUCCESSFULLY: 'Unvote thành công'
}

export const REPORT_MESSAGES = {
  REPORT_SUCCESSFULLY: 'Report thành công',
  UNREPORT_SUCCESSFULLY: 'Unreport thành công'
}
