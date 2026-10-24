import type { Request, Response } from 'express'
import { loginSchema, changePasswordSchema } from '../validators/auth.validator'
import { login, getMe, changePassword } from '../services/auth.service'
import { AppError, ok } from '../utils/response'
import { config } from '../config'

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body)
  const { token, user } = await login(body.username, body.password)
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
  ok(res, 'Logged in successfully', user)
}

export async function handleLogout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(config.cookieName, { path: '/' })
  ok(res, 'Logged out successfully', null)
}

export async function handleMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Not authenticated', 401)
  }

  const user = await getMe(req.user)
  ok(res, 'Current user', user)
}

export async function handleChangePassword(req: Request, res: Response): Promise<void> {
  const body = changePasswordSchema.parse(req.body)
  await changePassword(req.user!.id, body.currentPassword, body.newPassword)
  ok(res, 'Password changed successfully', null)
}
