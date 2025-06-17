import { Request, Response } from 'express'
import { checkDatabaseHealth } from '../config/database'
import { checkRedisHealth } from '../config/redis'

export async function health(req: Request, res: Response) {
  const db = await checkDatabaseHealth()
  const redis = await checkRedisHealth()
  return res.status(200).json({
    success: true,
    database: db,
    redis
  })
}
