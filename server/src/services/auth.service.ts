import bcrypt from 'bcryptjs'
import prisma from '../prisma'
import { AppError } from '../utils/response'
import { signToken, type AuthUser } from '../utils/token'

function sanitizeUser(user: {
  id: number
  username?: string
  role?: string
  mustChangePassword?: boolean
  studentId?: number | null
  createdAt?: Date | string
  updatedAt?: Date | string
  student?: unknown
}) {
  return {
    id: user.id,
    username: user.username ?? '',
    role: user.role ?? 'STUDENT',
    mustChangePassword: user.mustChangePassword ?? false,
    studentId: user.studentId ?? null,
    student: user.student ?? null,
    createdAt: user.createdAt ?? new Date().toISOString(),
    updatedAt: user.updatedAt ?? new Date().toISOString(),
  }
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { student: { include: { klass: true } } },
  })
  if (!user) {
    throw new AppError('Invalid username or password', 401)
  }
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new AppError('Invalid username or password', 401)
  }
  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    role: user.role as 'ADMIN' | 'STUDENT',
    studentId: user.studentId,
  }
  const token = signToken(authUser)
  return { token, user: sanitizeUser(user) }
}

export async function getMe(user: AuthUser) {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { student: { include: { klass: true } } },
  })

  if (!dbUser) {
    return sanitizeUser({
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.studentId,
      mustChangePassword: false,
    })
  }

  return sanitizeUser(dbUser)
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('User not found', 404)
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new AppError('Current password is incorrect', 400)
  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hash, mustChangePassword: false },
  })
}
