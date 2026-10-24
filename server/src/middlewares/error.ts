import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError, fail } from '../utils/response'

export function notFound(_req: Request, res: Response): void {
  fail(res, 'Route not found', 404)
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode)
  }
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join('; ')
    return fail(res, message, 422)
  }
  if (err instanceof multer.MulterError) {
    return fail(res, `Upload error: ${err.message}`, 400)
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return fail(res, 'A record with these details already exists', 409)
    if (err.code === 'P2003') return fail(res, 'Record is referenced by other data', 409)
    if (err.code === 'P2025') return fail(res, 'Record not found', 404)
  }
  console.error(err)
  return fail(res, 'Internal server error', 500)
}
