import { createClient } from 'redis'
import { logger } from './logger'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = createClient({
  url: redisUrl
})

redis.on('error', (err) => {
  logger.error('Redis Client Error:', err)
})

redis.on('connect', () => {
  logger.info('Redis Client Connected')
})

redis.on('ready', () => {
  logger.info('Redis Client Ready')
})

redis.on('end', () => {
  logger.info('Redis Client Disconnected')
})

export async function connectRedis() {
  try {
    await redis.connect()
    logger.info('Redis connection established')
    await redis.ping()
    logger.info('Redis connection test successful')
  } catch (error) {
    logger.error('Redis connection failed:', error)
    throw error
  }
}

export async function disconnectRedis() {
  try {
    await redis.disconnect()
    logger.info('Redis disconnected')
  } catch (error) {
    logger.error('Redis disconnection failed:', error)
    throw error
  }
}

export async function checkRedisHealth() {
  try {
    const pong = await redis.ping()
    return {
      status: 'healthy',
      response: pong,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Redis health check failed:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

export async function setCache(key: string, value: any, ttl: number = 3600) {
  try {
    await redis.setEx(key, ttl, JSON.stringify(value))
    return true
  } catch (error) {
    logger.error('Cache set failed:', { key, error })
    return false
  }
}

export async function getCache(key: string) {
  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    logger.error('Cache get failed:', { key, error })
    return null
  }
}

export async function deleteCache(key: string) {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    logger.error('Cache delete failed:', { key, error })
    return false
  }
}

export async function clearCache(pattern: string = '*') {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(keys)
    }
    return true
  } catch (error) {
    logger.error('Cache clear failed:', { pattern, error })
    return false
  }
}

export default redis
