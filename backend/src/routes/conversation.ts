import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validateRequest, validateParams } from '../middleware/validation.js'
import {
  createConversationSchema,
  updateConversationSchema,
  conversationIdParamSchema
} from '../schemas/conversation.js'
import * as controller from '../controllers/conversationController.js'

const router = Router()

router.post(
  '/',
  authenticateToken,
  validateRequest(createConversationSchema),
  controller.createConversation
)

router.get(
  '/',
  authenticateToken,
  controller.getConversations
)

router.get(
  '/:id',
  authenticateToken,
  validateParams(conversationIdParamSchema),
  controller.getConversation
)

router.put(
  '/:id',
  authenticateToken,
  validateParams(conversationIdParamSchema),
  validateRequest(updateConversationSchema),
  controller.updateConversation
)

router.delete(
  '/:id',
  authenticateToken,
  validateParams(conversationIdParamSchema),
  controller.deleteConversation
)

export default router
