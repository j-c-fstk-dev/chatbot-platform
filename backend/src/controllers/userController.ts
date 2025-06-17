import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { logger } from '../config/logger'
import { hashPassword, comparePassword, validatePasswordStrength } from '../config/auth'

/**
 * GET /api/user/profile
 * Authorization: Bearer <token>
 */
export async function getProfile(req: Request, res: Response) {
  const userId = req.user?.userId
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true }
    })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    return res.status(200).json({ success: true, user })
  } catch (error) {
    logger.error('User getProfile error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * PUT /api/user/profile
 * Body: { name }
 * Authorization: Bearer <token>
 */
export async function updateProfile(req: Request, res: Response) {
  const userId = req.user?.userId
  const { name } = req.body
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name }
    })
    logger.info('User updated profile', { userId })
    return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    logger.error('User updateProfile error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * PUT /api/user/change-password
 * Body: { currentPassword, newPassword }
 * Authorization: Bearer <token>
 */
export async function changePassword(req: Request, res: Response) {
  const userId = req.user?.userId
  const { currentPassword, newPassword } = req.body

  const pwValidation = validatePasswordStrength(newPassword)
  if (!pwValidation.isValid) {
    return res.status(400).json({ success: false, message: 'Password is too weak', errors: pwValidation.errors })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    const valid = await comparePassword(currentPassword, user.password)
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }
    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(newPassword) }
    })
    logger.info('User changed password', { userId })
    return res.status(200).json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    logger.error('User changePassword error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
