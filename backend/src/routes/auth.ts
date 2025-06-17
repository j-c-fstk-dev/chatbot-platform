import { Router } from 'express'
import * as controller from '../controllers/authController'
import { authRateLimit } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validation'
import { z } from 'zod'

const router = Router()

router.post(
  '/register',
  authRateLimit,
  validateBody(z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string().min(2)
  })),
  controller.register
)

router.post(
  '/login',
  authRateLimit,
  validateBody(z.object({
    email: z.string().email(),
    password: z.string()
  })),
  controller.login
)

router.post(
  '/logout',
  controller.logout
)

router.post(
  '/refresh',
  validateBody(z.object({
    refreshToken: z.string()
  })),
  controller.refresh
)

router.post(
  '/request-password-reset',
  passwordResetRateLimit,
  validateBody(z.object({
    email: z.string().email()
  })),
  controller.requestPasswordReset
)

router.post(
  '/reset-password',
  validateBody(z.object({
    token: z.string(),
    newPassword: z.string()
  })),
  controller.resetPassword
)

router.post(
  '/verify-email',
  validateBody(z.object({
    token: z.string()
  })),
  controller.verifyEmail
)

export default router
