import { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'
import path from 'path'
import fs from 'fs'

export async function uploadFile(req: Request, res: Response) {
  const userId = req.user?.userId
  // supondo uso do multer, arquivo está em req.file
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  try {
    const file = await prisma.file.create({
      data: {
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      }
    })
    res.status(201).json({ success: true, data: { file } })
  } catch (error) {
    logger.error('Upload file failed:', error)
    res.status(500).json({ success: false, message: 'Failed to upload file' })
  }
}

export async function getFiles(req: Request, res: Response) {
  const userId = req.user?.userId
  try {
    const files = await prisma.file.findMany({
      where: { userId }
    })
    res.status(200).json({ success: true, data: { files } })
  } catch (error) {
    logger.error('Get files failed:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch files' })
  }
}

export async function downloadFile(req: Request, res: Response) {
  const userId = req.user?.userId
  const { id } = req.params
  try {
    const file = await prisma.file.findFirst({ where: { id, userId } })
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }
    res.download(file.path, file.originalName)
  } catch (error) {
    logger.error('Download file failed:', error)
    res.status(500).json({ success: false, message: 'Failed to download file' })
  }
}

export async function deleteFile(req: Request, res: Response) {
  const userId = req.user?.userId
  const { id } = req.params
  try {
    const file = await prisma.file.findFirst({ where: { id, userId } })
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }
    await prisma.file.delete({ where: { id } })
    // remove fisicamente
    fs.unlinkSync(file.path)
    res.status(200).json({ success: true, message: 'File deleted' })
  } catch (error) {
    logger.error('Delete file failed:', error)
    res.status(500).json({ success: false, message: 'Failed to delete file' })
  }
}
