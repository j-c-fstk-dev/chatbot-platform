import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../config/auth'
import { logger } from '../config/logger'
import { redis } from '../config/redis'

// Estende o Request para incluir req.user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Formato: Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }
    // Verifica se o token está revogado/blacklist (logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      })
    }
    // Decodifica e valida token
    const decoded = verifyAccessToken(token)
    req.user = decoded

    logger.info('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      ip: req.ip
    })
    next()
  } catch (error) {
    logger.error('Authentication failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return next()
  }
  try {
    const decoded = verifyAccessToken(token)
    req.user = decoded
  } catch (error) {
    logger.warn('Optional auth failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    })
  }
  next()
}

export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    const userRole = req.user.role || 'user'
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions:', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles,
        ip: req.ip
      })
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }
    next()
  }
}

// Adiciona token à blacklist no Redis (logout)
export async function revokeToken(token: string, expiresIn: number = 3600) {
  try {
    await redis.setEx(`blacklist:${token}`, expiresIn, 'revoked')
    logger.info('Token revoked successfully')
  } catch (error) {
    logger.error('Failed to revoke token:', error)
    throw new Error('Failed to revoke token')
  }
}

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  revokeToken
}
