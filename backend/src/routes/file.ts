import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth.js'
import { validateParams } from '../middleware/validation.js'
import { fileIdParamSchema } from '../schemas/file.js'
import * as controller from '../controllers/fileController.js'

const upload = multer({ dest: process.env.UPLOAD_DIR || 'uploads/' })

const router = Router()

router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  controller.uploadFile
)

router.get(
  '/',
  authenticateToken,
  controller.getFiles
)

router.get(
  '/:id',
  authenticateToken,
  validateParams(fileIdParamSchema),
  controller.downloadFile
)

router.delete(
  '/:id',
  authenticateToken,
  validateParams(fileIdParamSchema),
  controller.deleteFile
)

export default router
