import type { Response } from 'express'

export function ok<T>(res: Response, message: string, data: T, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export function fail(res: Response, message: string, status = 400): void {
  res.status(status).json({ success: false, message, data: null })
}

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}
