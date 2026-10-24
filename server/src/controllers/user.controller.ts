import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma'
import { AppError, ok } from '../utils/response'

export async function handleListUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { student: true },
  })
  const safe = users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
    studentId: u.studentId,
    student: u.student,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }))
  ok(res, 'Users retrieved', safe)
}

export async function handleResetUserPassword(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)

  let defaultPassword = user.username
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { id: user.studentId ?? 0 } })
    if (student) defaultPassword = student.admissionNumber
  }
  const hash = await bcrypt.hash(defaultPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hash, mustChangePassword: user.role === 'STUDENT' },
  })
  ok(res, 'Password reset successfully', null)
}

export async function handleDeleteUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)
  if (user.role === 'ADMIN') throw new AppError('Cannot delete an admin account', 400)
  await prisma.user.delete({ where: { id: userId } })
  ok(res, 'User deleted successfully', null)
}
