import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validateRequest, validateParams } from '../middleware/validation.js'
import { createApiKeySchema, apiKeyIdParamSchema } from '../schemas/apiKey.js'
import * as controller from '../controllers/apiKeyController.js'

const router = Router()

router.post(
  '/',
  authenticateToken,
  validateRequest(createApiKeySchema),
  controller.createApiKey
)

router.get(
  '/',
  authenticateToken,
  controller.getApiKeys
)

router.delete(
  '/:id',
  authenticateToken,
  validateParams(apiKeyIdParamSchema),
  controller.deleteApiKey
)

export default router
