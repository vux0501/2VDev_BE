import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Pagination } from '~/models/requests/Post.request'
import notificationsService from '~/services/notifications.services'

export const getNotificationController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await notificationsService.getNotifications(user_id, limit, page)
  return res.json({
    message: 'Get posts by hashtag Successfully',
    result: {
      notifications: result.notifications,
      limit,
      page,
      notifications_count: result.total,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const readedNotificationController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const notification_id = req.params.notification_id

  await notificationsService.readedNotification(notification_id)
  return res.json({
    message: 'Readed'
  })
}

export const getCountNotificationController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response
) => {
  const user_id = req.decoded_authorization?.user_id as string

  const result = await notificationsService.getCountNotification(user_id)
  return res.json({
    result: result
  })
}
