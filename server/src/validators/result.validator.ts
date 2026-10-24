import { z } from 'zod'

export const resultSchema = z.object({
  studentId: z.coerce.number().int().positive('A student is required'),
  subjectId: z.coerce.number().int().positive('A subject is required'),
  sessionId: z.coerce.number().int().positive('A session is required'),
  termId: z.coerce.number().int().positive('A term is required'),
  ca: z.coerce.number().min(0, 'CA must be between 0 and 40').max(40, 'CA must be between 0 and 40'),
  exam: z.coerce.number().min(0, 'Exam must be between 0 and 60').max(60, 'Exam must be between 0 and 60'),
})
