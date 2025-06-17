import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { logger } from './config/logger.js'
import { connectDatabase } from './config/database.js'
import { connectRedis } from './config/redis.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'

// Rotas
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import conversationRoutes from './routes/conversation.js'
import messageRoutes from './routes/message.js'
import apiKeyRoutes from './routes/apiKey.js'
import fileRoutes from './routes/file.js'

dotenv.config()
const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 8000

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(rateLimitMiddleware)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('User-Agent') })
  next()
})

// Rotas principais
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/conversation', conversationRoutes)
app.use('/api/message', messageRoutes)
app.use('/api/apikey', apiKeyRoutes)
app.use('/api/file', fileRoutes)

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', path: req.originalUrl })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path, method: req.method, ip: req.ip })
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

async function startServer() {
  try {
    await connectDatabase()
    logger.info('Database connected successfully')
    await connectRedis()
    logger.info('Redis connected successfully')
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { environment: process.env.NODE_ENV, port: PORT })
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}
startServer()
export default app
