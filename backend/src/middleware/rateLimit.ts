import rateLimit from 'express-rate-limit'
import { redis } from '../config/redis'
import { logger } from '../config/logger'
import { Request, Response } from 'express'

// Store customizado para Redis
class RedisStore {
  constructor(private prefix: string = 'rl:') {}

  async increment(key: string): Promise<{ totalHits: number; timeToExpire?: number }> {
    const redisKey = `${this.prefix}${key}`
    try {
      const current = await redis.get(redisKey)
      if (current === null) {
        await redis.setEx(redisKey, 900, '1') // 15 min TTL
        return { totalHits: 1, timeToExpire: 900000 }
      } else {
        const totalHits = await redis.incr(redisKey)
        const ttl = await redis.ttl(redisKey)
        return { totalHits, timeToExpire: ttl * 1000 }
      }
    } catch (error) {
      logger.error('Redis rate limit error:', error)
      return { totalHits: 1 }
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`
    try {
      await redis.decr(redisKey)
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error)
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`
    try {
      await redis.del(redisKey)
    } catch (error) {
      logger.error('Redis rate limit reset error:', error)
    }
  }
}

// Limite geral
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('general:'),
  keyGenerator: (req: Request) => req.user?.userId || req.ip,
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path,
      userAgent: req.get('User-Agent')
    })
  }
})

// Limite para endpoints de autenticação
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('auth:'),
  skipSuccessfulRequests: true,
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    })
  }
})

// Limite para API LLM/chat
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many API requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('api:'),
  keyGenerator: (req: Request) => req.user?.userId || req.ip,
  skip: (req: Request) => req.path.includes('/health'),
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path
    })
  }
})

// Limite para uploads (ex: imagens)
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('upload:'),
  keyGenerator: (req: Request) => req.user?.userId || req.ip
})

// Limite para reset de senha
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore('password-reset:'),
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
      userAgent: req.get('User-Agent')
    })
  }
})

export default {
  rateLimitMiddleware,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  passwordResetRateLimit
}
