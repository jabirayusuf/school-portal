import { z } from 'zod'

export const studentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().default(''),
  lastName: z.string().min(1, 'Last name is required').max(100),
  gender: z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().max(30).optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  classId: z.coerce.number({ message: 'A class is required' }).int().positive(),
  graduationYear: z.coerce.number().int().min(1990).max(2100).optional().nullable(),
})
