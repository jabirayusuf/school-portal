import { z } from 'zod'

export const sessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(50),
  isCurrent: z.boolean().optional().default(false),
})

export const termSchema = z.object({
  name: z.string().min(1, 'Term name is required').max(50),
  sessionId: z.coerce.number().int().positive('A session is required'),
})

export const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().min(1, 'Subject code is required').max(20),
})

export const classSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(50),
})
