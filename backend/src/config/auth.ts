import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { logger } from './logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface TokenPayload {
  userId: string
  email: string
  role?: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat?: number
  exp?: number
}

// JWT Token functions
export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'chatbot-platform',
      audience: 'chatbot-platform-users'
    })
  } catch (error) {
    logger.error('Error generating access token:', error)
    throw new Error('Failed to generate access token')
  }
}

export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'chatbot-platform',
      audience: 'chatbot-platform-users'
    })
  } catch (error) {
    logger.error('Error generating refresh token:', error)
    throw new Error('Failed to generate refresh token')
  }
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'chatbot-platform',
      audience: 'chatbot-platform-users'
    }) as TokenPayload
  } catch (error) {
    logger.error('Error verifying access token:', error)
    throw new Error('Invalid access token')
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'chatbot-platform',
      audience: 'chatbot-platform-users'
    }) as RefreshTokenPayload
  } catch (error) {
    logger.error('Error verifying refresh token:', error)
    throw new Error('Invalid refresh token')
  }
}

// Password functions
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    logger.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    logger.error('Error comparing password:', error)
    throw new Error('Failed to compare password')
  }
}

// Encryption functions for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

export function encryptApiKey(apiKey: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    logger.error('Error encrypting API key:', error)
    throw new Error('Failed to encrypt API key')
  }
}

export function decryptApiKey(encryptedApiKey: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedApiKey.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    logger.error('Error decrypting API key:', error)
    throw new Error('Failed to decrypt API key')
  }
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate password reset token
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = generateSecureToken(32)
  const expires = new Date(Date.now() + 3600000) // 1 hour from now
  return { token, expires }
}

// Generate email verification token
export function generateEmailVerificationToken(): { token: string; expires: Date } {
  const token = generateSecureToken(32)
  const expires = new Date(Date.now() + 86400000) // 24 hours from now
  return { token, expires }
}

// Validate password strength
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters long')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
  if (!/\d/.test(password)) errors.push('Password must contain at least one number')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain at least one special character')
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  encryptApiKey,
  decryptApiKey,
  generateSecureToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  validatePasswordStrength
}
