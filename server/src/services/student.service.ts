import bcrypt from 'bcryptjs'
import path from 'node:path'
import prisma from '../prisma'
import { AppError } from '../utils/response'

export interface StudentQuery {
  page?: number
  pageSize?: number
  search?: string
  classId?: number
  gender?: string
}

export interface StudentInput {
  admissionNumber: string
  firstName: string
  middleName?: string
  lastName: string
  gender: string
  dateOfBirth?: string | null
  phone?: string
  email?: string
  address?: string
  classId: number
  graduationYear?: number | null
}

function buildWhere(query: StudentQuery) {
  const where: Record<string, unknown> = {}
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search } },
      { lastName: { contains: query.search } },
      { middleName: { contains: query.search } },
      { admissionNumber: { contains: query.search } },
    ]
  }
  if (query.classId) where.classId = query.classId
  if (query.gender) where.gender = query.gender
  return where
}

export async function listStudents(query: StudentQuery) {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10))
  const where = buildWhere(query)

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { klass: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getStudent(id: number) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: { klass: true },
  })
  if (!student) throw new AppError('Student not found', 404)
  return student
}

export async function createStudent(input: StudentInput) {
  const existing = await prisma.student.findUnique({
    where: { admissionNumber: input.admissionNumber },
  })
  if (existing) throw new AppError('Admission number already exists', 409)

  const klass = await prisma.class.findUnique({ where: { id: input.classId } })
  if (!klass) throw new AppError('Selected class does not exist', 422)

  const passwordHash = await bcrypt.hash(input.admissionNumber, 10)

  const student = await prisma.$transaction(async (tx) => {
    const created = await tx.student.create({
      data: {
        admissionNumber: input.admissionNumber,
        firstName: input.firstName,
        middleName: input.middleName || null,
        lastName: input.lastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        classId: input.classId,
        graduationYear: input.graduationYear ?? null,
      },
    })
    await tx.user.create({
      data: {
        username: created.admissionNumber,
        password: passwordHash,
        role: 'STUDENT',
        mustChangePassword: true,
        studentId: created.id,
      },
    })
    return created
  })

  return getStudent(student.id)
}

export async function updateStudent(id: number, input: StudentInput) {
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) throw new AppError('Student not found', 404)

  if (input.admissionNumber !== student.admissionNumber) {
    const existing = await prisma.student.findUnique({
      where: { admissionNumber: input.admissionNumber },
    })
    if (existing) throw new AppError('Admission number already exists', 409)
  }

  const klass = await prisma.class.findUnique({ where: { id: input.classId } })
  if (!klass) throw new AppError('Selected class does not exist', 422)

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.student.update({
      where: { id },
      data: {
        admissionNumber: input.admissionNumber,
        firstName: input.firstName,
        middleName: input.middleName || null,
        lastName: input.lastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        classId: input.classId,
        graduationYear: input.graduationYear ?? null,
      },
    })
    if (input.admissionNumber !== student.admissionNumber) {
      await tx.user.updateMany({
        where: { studentId: id },
        data: { username: input.admissionNumber },
      })
    }
    return s
  })

  return getStudent(updated.id)
}

export async function deleteStudent(id: number) {
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) throw new AppError('Student not found', 404)
  await prisma.$transaction([
    prisma.user.deleteMany({ where: { studentId: id } }),
    prisma.student.delete({ where: { id } }),
  ])
}

export async function uploadStudentPhoto(id: number, file: Express.Multer.File) {
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) throw new AppError('Student not found', 404)
  const photoUrl = `/uploads/${path.basename(file.path)}`
  return prisma.student.update({ where: { id }, data: { passportPhoto: photoUrl } })
}
