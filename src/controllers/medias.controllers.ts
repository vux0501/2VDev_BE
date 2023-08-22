import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/messages'
import { handleUploadSingleImage } from '~/utils/file'
export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadSingleImage(req)
  return res.json({
    result: data
  })
}
