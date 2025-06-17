import { z } from 'zod'

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['openai', 'anthropic', 'google']),
  key: z.string().min(1)
})

export const apiKeyIdParamSchema = z.object({
  id: z.string().min(1)
})
