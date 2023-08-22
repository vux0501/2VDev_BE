import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { getNameFromFullname, handleUploadSingleImage } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
import dotenv from 'dotenv'
dotenv.config()

class MediasService {
  async handleUpdateSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)

    const newName = getNameFromFullname(file.newFilename)
    const newFullFilename = `${newName}.jpg`
    const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFilename)

    await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/static/image/${newName}.jpg`
      : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`
  }
}

const mediasService = new MediasService()

export default mediasService
