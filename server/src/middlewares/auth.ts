import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/token'
import { AppError } from '../utils/response'
import { config } from '../config'

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.cookieName]
  if (!token) {
    throw new AppError('Not authenticated', 401)
  }
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    throw new AppError('Session expired or invalid', 401)
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403)
  }
  next()
}

export function requireStudent(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'STUDENT') {
    throw new AppError('Student access required', 403)
  }
  next()
}
