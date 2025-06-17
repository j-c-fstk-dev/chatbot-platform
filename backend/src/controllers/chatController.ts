import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { logger } from '../config/logger'
import { getCache, setCache } from '../config/redis'
// import { callLLM } from '../services/llmService' // Exemplo para integração IA

/**
 * POST /api/chat/send
 * Body: { message: string }
 * Authorization: Bearer <token>
 */
export async function sendMessage(req: Request, res: Response) {
  const userId = req.user?.userId
  const { message } = req.body

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' })
  }

  try {
    // Opcional: Salvar histórico no banco
    const newMessage = await prisma.message.create({
      data: {
        userId,
        role: 'user',
        content: message
      }
    })

    // Consulta o histórico do usuário
    const history = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20
    })

    // Chama o LLM provider (exemplo fictício)
    // const llmResponse = await callLLM(message, history)
    // Simulação de resposta
    const llmResponse = `Echo: ${message}`

    // Salva resposta do bot no banco
    await prisma.message.create({
      data: {
        userId,
        role: 'assistant',
        content: llmResponse
      }
    })

    logger.info('Chat message sent', { userId, message })

    return res.status(200).json({
      success: true,
      reply: llmResponse
    })
  } catch (error) {
    logger.error('Chat sendMessage error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * GET /api/chat/history
 * Query: ?limit=20
 * Authorization: Bearer <token>
 */
export async function getHistory(req: Request, res: Response) {
  const userId = req.user?.userId
  const limit = parseInt(req.query.limit as string) || 20

  try {
    // Cache (opcional)
    const cacheKey = `chat:history:${userId}:${limit}`
    const cached = await getCache(cacheKey)
    if (cached) {
      return res.status(200).json({
        success: true,
        messages: cached
      })
    }

    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit
    })

    await setCache(cacheKey, messages, 60) // cache 1 min

    return res.status(200).json({
      success: true,
      messages
    })
  } catch (error) {
    logger.error('Chat getHistory error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * DELETE /api/chat/history
 * Authorization: Bearer <token>
 */
export async function clearHistory(req: Request, res: Response) {
  const userId = req.user?.userId
  try {
    await prisma.message.deleteMany({ where: { userId } })
    logger.info('Chat history cleared', { userId })
    return res.status(200).json({ success: true, message: 'Chat history cleared' })
  } catch (error) {
    logger.error('Chat clearHistory error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
