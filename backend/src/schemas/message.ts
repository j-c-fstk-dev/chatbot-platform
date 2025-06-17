import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required')
})

export const messageIdParamSchema = z.object({
  id: z.string().min(1, 'Message ID is required')
})
