import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validateRequest, validateParams, validateQuery } from '../middleware/validation.js'
import { sendMessageSchema, messageIdParamSchema } from '../schemas/message.js'
import * as controller from '../controllers/messageController.js'

const router = Router()

router.post(
  '/',
  authenticateToken,
  validateRequest(sendMessageSchema),
  controller.sendMessage
)

router.get(
  '/',
  authenticateToken,
  validateQuery(sendMessageSchema.pick({ conversationId: true })),
  controller.getMessages
)

router.delete(
  '/:id',
  authenticateToken,
  validateParams(messageIdParamSchema),
  controller.deleteMessage
)

export default router
