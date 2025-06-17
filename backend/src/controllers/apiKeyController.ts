import { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { encryptApiKey } from '../config/auth.js'
import { logger } from '../config/logger.js'

export async function createApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { name, provider, key } = req.body

    const encryptedKey = encryptApiKey(key)
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        provider,
        encryptedKey
      }
    })

    res.status(201).json({ success: true, message: 'API key created', data: { apiKey } })
  } catch (error) {
    logger.error('Create API key failed:', error)
    res.status(500).json({ success: false, message: 'Failed to create API key' })
  }
}

export async function getApiKeys(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, provider: true, createdAt: true, lastUsedAt: true }
    })
    res.status(200).json({ success: true, data: { apiKeys } })
  } catch (error) {
    logger.error('Get API keys failed:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch API keys' })
  }
}

export async function deleteApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const result = await prisma.apiKey.updateMany({
      where: { id, userId },
      data: { isActive: false }
    })
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'API key not found' })
    }
    res.status(200).json({ success: true, message: 'API key revoked' })
  } catch (error) {
    logger.error('Delete API key failed:', error)
    res.status(500).json({ success: false, message: 'Failed to revoke API key' })
  }
}
