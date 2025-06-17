import { Request, Response } from 'express'
import { prisma } from '../config/database'
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateEmailVerificationToken,
  generatePasswordResetToken
} from '../config/auth'
import { logger } from '../config/logger'
import { revokeToken } from '../middleware/auth'

/**
 * POST /api/auth/register
 * Body: { email, password, name }
 */
export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body

  // Validate password
  const pwValidation = validatePasswordStrength(password)
  if (!pwValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password is too weak',
      errors: pwValidation.errors
    })
  }

  try {
    const emailExists = await prisma.user.findUnique({ where: { email } })
    if (emailExists) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: false
      }
    })

    // Generate email verification token (store in db or send via email)
    const { token, expires } = generateEmailVerificationToken()
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires
      }
    })

    // TODO: send email (out of scope)
    logger.info('User registered', { userId: user.id, email })

    return res.status(201).json({
      success: true,
      message: 'Registered successfully. Please verify your email.',
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    logger.error('Register error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    if (!user.emailVerified) {
      return res.status(403).json({ success: false, message: 'Email not verified' })
    }
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id, tokenId: user.id })
    // Optionally, store refresh token in DB or Redis
    logger.info('User login', { userId: user.id, email })
    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  } catch (error) {
    logger.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/logout
 * Body: { refreshToken }
 * Authorization: Bearer <accessToken>
 */
export async function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  const { refreshToken } = req.body
  try {
    if (token) await revokeToken(token, 3600)
    // Optionally, blacklist refreshToken also
    logger.info('User logout', { userId: req.user?.userId, email: req.user?.email })
    return res.status(200).json({ success: true, message: 'Logged out' })
  } catch (error) {
    logger.error('Logout error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body
  try {
    // TODO: Verify refreshToken, fetch user, check expiry, etc.
    // For demo, let's just decode and issue new tokens
    // In production, store refresh tokens in DB and check if revoked
    const jwt = require('jsonwebtoken')
    const decoded = jwt.decode(refreshToken)
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' })
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role })
    const newRefreshToken = generateRefreshToken({ userId: user.id, tokenId: user.id })
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })
  } catch (error) {
    logger.error('Refresh token error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/request-password-reset
 * Body: { email }
 */
export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Não revela se email existe ou não!
      return res.status(200).json({ success: true, message: 'If your email exists, you will receive an email shortly.' })
    }
    const { token, expires } = generatePasswordResetToken()
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires
      }
    })
    // TODO: Enviar email com token
    logger.info('Password reset requested', { userId: user.id, email })
    return res.status(200).json({ success: true, message: 'If your email exists, you will receive an email shortly.' })
  } catch (error) {
    logger.error('Request password reset error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body
  const pwValidation = validatePasswordStrength(newPassword)
  if (!pwValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password is too weak',
      errors: pwValidation.errors
    })
  }
  try {
    const record = await prisma.passwordReset.findUnique({ where: { token } })
    if (!record || record.expiresAt < new Date() || record.used) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(newPassword) }
    })
    await prisma.passwordReset.update({
      where: { token },
      data: { used: true }
    })
    logger.info('Password reset', { userId: record.userId })
    return res.status(200).json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    logger.error('Reset password error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

/**
 * POST /api/auth/verify-email
 * Body: { token }
 */
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body
  try {
    const record = await prisma.emailVerification.findUnique({ where: { token } })
    if (!record || record.expiresAt < new Date() || record.used) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true }
    })
    await prisma.emailVerification.update({
      where: { token },
      data: { used: true }
    })
    logger.info('Email verified', { userId: record.userId })
    return res.status(200).json({ success: true, message: 'Email verified successfully' })
  } catch (error) {
    logger.error('Verify email error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
