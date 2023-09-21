import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { REPORT_MESSAGES, VOTE_MESSAGES } from '~/constants/messages'
import { ReportRequestBody } from '~/models/requests/Report.request'

import { TokenPayload } from '~/models/requests/User.request'
import reportsService from '~/services/reports.services'

export const reportPostController = async (
  req: Request<ParamsDictionary, any, ReportRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await reportsService.reportPost(user_id, req.body.post_id, req.body.reason)
  return res.json({
    message: REPORT_MESSAGES.REPORT_SUCCESSFULLY,
    data: result
  })
}

export const unReportPostController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  await reportsService.unReportPost(user_id, req.params.post_id)
  return res.json({
    message: REPORT_MESSAGES.UNREPORT_SUCCESSFULLY
  })
}
