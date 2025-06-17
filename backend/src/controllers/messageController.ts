import { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

export async function sendMessage(req: Request, res: Response) {
  const userId = req.user?.userId
  const { conversationId, content } = req.body

  try {
    // Cria mensagem do usuário
    const message = await prisma.message.create({
      data: {
        conversationId,
        userId,
        role: 'user',
        content
      }
    })

    // Aqui você pode chamar o LLM provider (OpenAI, etc) — placeholder
    // const llmReply = await callLLM(content, conversationId);
    const llmReply = `Echo: ${content}` // Exemplo

    // Cria resposta do bot
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        userId,
        role: 'assistant',
        content: llmReply
      }
    })

    res.status(200).json({
      success: true,
      data: { reply: assistantMessage }
    })
  } catch (error) {
    logger.error('Send message failed:', error)
    res.status(500).json({ success: false, message: 'Failed to send message' })
  }
}

export async function getMessages(req: Request, res: Response) {
  const userId = req.user?.userId
  const { conversationId } = req.query
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId as string, userId },
      orderBy: { createdAt: 'asc' }
    })
    res.status(200).json({ success: true, data: { messages } })
  } catch (error) {
    logger.error('Get messages failed:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch messages' })
  }
}

export async function deleteMessage(req: Request, res: Response) {
  const userId = req.user?.userId
  const { id } = req.params
  try {
    const result = await prisma.message.deleteMany({
      where: { id, userId }
    })
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }
    res.status(200).json({ success: true, message: 'Message deleted' })
  } catch (error) {
    logger.error('Delete message failed:', error)
    res.status(500).json({ success: false, message: 'Failed to delete message' })
  }
}
