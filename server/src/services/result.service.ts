import prisma from '../prisma'
import { AppError } from '../utils/response'
import { calculateGrade } from '../utils/grade'

export interface ResultInput {
  studentId: number
  subjectId: number
  sessionId: number
  termId: number
  ca: number
  exam: number
}

export interface ResultQuery {
  page?: number
  pageSize?: number
  studentId?: number
  sessionId?: number
  termId?: number
  classId?: number
  onlyMine?: number
}

const include = {
  student: true,
  subject: true,
  session: true,
  term: true,
}

export async function listResults(query: ResultQuery) {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 15))
  const where: Record<string, unknown> = {}

  if (query.onlyMine) {
    where.studentId = query.onlyMine
  } else {
    if (query.studentId) where.studentId = query.studentId
    if (query.classId) where.student = { classId: query.classId }
  }
  if (query.sessionId) where.sessionId = query.sessionId
  if (query.termId) where.termId = query.termId

  const [items, total] = await Promise.all([
    prisma.result.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.result.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getResult(id: number) {
  const result = await prisma.result.findUnique({ where: { id }, include })
  if (!result) throw new AppError('Result not found', 404)
  return result
}

async function ensureReferences(input: ResultInput) {
  const [student, subject, session, term] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.session.findUnique({ where: { id: input.sessionId } }),
    prisma.term.findUnique({ where: { id: input.termId } }),
  ])
  if (!student) throw new AppError('Student not found', 422)
  if (!subject) throw new AppError('Subject not found', 422)
  if (!session) throw new AppError('Session not found', 422)
  if (!term) throw new AppError('Term not found', 422)
  if (term.sessionId !== input.sessionId) {
    throw new AppError('Term does not belong to the selected session', 422)
  }
}

export async function createResult(input: ResultInput) {
  await ensureReferences(input)
  const duplicate = await prisma.result.findUnique({
    where: {
      studentId_sessionId_termId_subjectId: {
        studentId: input.studentId,
        sessionId: input.sessionId,
        termId: input.termId,
        subjectId: input.subjectId,
      },
    },
  })
  if (duplicate) throw new AppError('A result already exists for this student, session, term and subject', 409)

  const total = input.ca + input.exam
  const { grade, remark } = calculateGrade(total)
  return prisma.result.create({
    data: { ...input, total, grade, remark },
    include,
  })
}

export async function updateResult(id: number, input: ResultInput) {
  const existing = await prisma.result.findUnique({ where: { id } })
  if (!existing) throw new AppError('Result not found', 404)
  await ensureReferences(input)

  const duplicate = await prisma.result.findFirst({
    where: {
      studentId: input.studentId,
      sessionId: input.sessionId,
      termId: input.termId,
      subjectId: input.subjectId,
      NOT: { id },
    },
  })
  if (duplicate) throw new AppError('A result already exists for this student, session, term and subject', 409)

  const total = input.ca + input.exam
  const { grade, remark } = calculateGrade(total)
  return prisma.result.update({
    where: { id },
    data: { ...input, total, grade, remark },
    include,
  })
}

export async function deleteResult(id: number) {
  await prisma.result.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Result not found', 404)
  })
  await prisma.result.delete({ where: { id } })
}
