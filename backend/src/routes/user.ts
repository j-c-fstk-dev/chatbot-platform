import { Router } from 'express'
import * as controller from '../controllers/userController'
import { authenticateToken } from '../middleware/auth'
import { validateBody } from '../middleware/validation'
import { z } from 'zod'

const router = Router()

router.get(
  '/profile',
  authenticateToken,
  controller.getProfile
)

router.put(
  '/profile',
  authenticateToken,
  validateBody(z.object({
    name: z.string().min(2)
  })),
  controller.updateProfile
)

router.put(
  '/change-password',
  authenticateToken,
  validateBody(z.object({
    currentPassword: z.string(),
    newPassword: z.string()
  })),
  controller.changePassword
)

export default router
