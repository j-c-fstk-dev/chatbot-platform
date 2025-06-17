import { Router } from 'express'
import * as controller from '../controllers/chatController'
import { authenticateToken } from '../middleware/auth'
import { apiRateLimit } from '../middleware/rateLimit'
import { validateBody, validateQuery } from '../middleware/validation'
import { z } from 'zod'

const router = Router()

router.post(
  '/send',
  authenticateToken,
  apiRateLimit,
  validateBody(z.object({
    message: z.string().min(1)
  })),
  controller.sendMessage
)

router.get(
  '/history',
  authenticateToken,
  apiRateLimit,
  validateQuery(z.object({
    limit: z.string().optional()
  })),
  controller.getHistory
)

router.delete(
  '/history',
  authenticateToken,
  apiRateLimit,
  controller.clearHistory
)

export default router
