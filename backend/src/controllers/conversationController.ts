import { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

export async function createConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { title, model, provider } = req.body

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        model,
        provider
      }
    })

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      data: { conversation }
    })
  } catch (error) {
    logger.error('Create conversation failed:', error)
    res.status(500).json({ success: false, message: 'Failed to create conversation' })
  }
}

export async function getConversations(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
    res.status(200).json({ success: true, data: { conversations } })
  } catch (error) {
    logger.error('Get conversations failed:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' })
  }
}

export async function getConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId }
    })
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }
    res.status(200).json({ success: true, data: { conversation } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversation' })
  }
}

export async function updateConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const { title, model, provider } = req.body

    const conversation = await prisma.conversation.updateMany({
      where: { id, userId },
      data: { title, model, provider }
    })

    if (conversation.count === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    res.status(200).json({ success: true, message: 'Conversation updated' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update conversation' })
  }
}

export async function deleteConversation(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const conversation = await prisma.conversation.deleteMany({
      where: { id, userId }
    })
    if (conversation.count === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }
    res.status(200).json({ success: true, message: 'Conversation deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete conversation' })
  }
}
