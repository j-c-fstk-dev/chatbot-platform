import { z } from 'zod'

export const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  model: z.string().optional(),
  provider: z.string().optional()
})

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  model: z.string().optional(),
  provider: z.string().optional()
})

export const conversationIdParamSchema = z.object({
  id: z.string().min(1, 'Conversation ID is required')
})
