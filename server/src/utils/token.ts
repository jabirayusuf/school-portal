import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface AuthUser {
  id: number
  username: string
  role: 'ADMIN' | 'STUDENT'
  studentId: number | null
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, config.jwtSecret) as AuthUser
}
