import prisma from '../prisma'
import { AppError } from '../utils/response'

export async function listClasses() {
  return prisma.class.findMany({ orderBy: { name: 'asc' } })
}

export async function createClass(name: string) {
  const existing = await prisma.class.findUnique({ where: { name } })
  if (existing) throw new AppError('Class already exists', 409)
  return prisma.class.create({ data: { name } })
}

export async function updateClass(id: number, name: string) {
  await prisma.class.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Class not found', 404)
  })
  return prisma.class.update({ where: { id }, data: { name } })
}

export async function deleteClass(id: number) {
  const klass = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  })
  if (!klass) throw new AppError('Class not found', 404)
  if (klass._count.students > 0) {
    throw new AppError('Cannot delete a class that has students assigned', 409)
  }
  await prisma.class.delete({ where: { id } })
}

export async function listSubjects() {
  return prisma.subject.findMany({ orderBy: { name: 'asc' } })
}

export async function createSubject(name: string, code: string) {
  const existing = await prisma.subject.findFirst({
    where: { OR: [{ name }, { code }] },
  })
  if (existing) throw new AppError('Subject name or code already exists', 409)
  return prisma.subject.create({ data: { name, code } })
}

export async function updateSubject(id: number, name: string, code: string) {
  await prisma.subject.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Subject not found', 404)
  })
  return prisma.subject.update({ where: { id }, data: { name, code } })
}

export async function deleteSubject(id: number) {
  await prisma.subject.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Subject not found', 404)
  })
  await prisma.subject.delete({ where: { id } })
}

export async function listSessions() {
  return prisma.session.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function createSession(name: string, isCurrent: boolean) {
  const existing = await prisma.session.findUnique({ where: { name } })
  if (existing) throw new AppError('Session already exists', 409)
  if (isCurrent) {
    await prisma.session.updateMany({ data: { isCurrent: false } })
  }
  return prisma.session.create({ data: { name, isCurrent } })
}

export async function updateSession(id: number, name: string, isCurrent: boolean) {
  await prisma.session.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Session not found', 404)
  })
  if (isCurrent) {
    await prisma.session.updateMany({ data: { isCurrent: false } })
  }
  return prisma.session.update({ where: { id }, data: { name, isCurrent } })
}

export async function setCurrentSession(id: number) {
  await prisma.session.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Session not found', 404)
  })
  await prisma.$transaction([
    prisma.session.updateMany({ data: { isCurrent: false } }),
    prisma.session.update({ where: { id }, data: { isCurrent: true } }),
  ])
  return prisma.session.findUnique({ where: { id } })
}

export async function deleteSession(id: number) {
  await prisma.session.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Session not found', 404)
  })
  await prisma.session.delete({ where: { id } })
}

export async function listTerms() {
  return prisma.term.findMany({
    include: { session: true },
    orderBy: [{ session: { createdAt: 'asc' } }, { id: 'asc' }],
  })
}

export async function createTerm(name: string, sessionId: number) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) throw new AppError('Session not found', 422)
  const existing = await prisma.term.findUnique({
    where: { sessionId_name: { sessionId, name } },
  })
  if (existing) throw new AppError('Term already exists for this session', 409)
  return prisma.term.create({ data: { name, sessionId } })
}

export async function updateTerm(id: number, name: string, sessionId: number) {
  const term = await prisma.term.findUnique({ where: { id } })
  if (!term) throw new AppError('Term not found', 404)
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) throw new AppError('Session not found', 422)
  const existing = await prisma.term.findUnique({
    where: { sessionId_name: { sessionId, name } },
  })
  if (existing && existing.id !== id) throw new AppError('Term already exists for this session', 409)
  return prisma.term.update({ where: { id }, data: { name, sessionId } })
}

export async function deleteTerm(id: number) {
  await prisma.term.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new AppError('Term not found', 404)
  })
  await prisma.term.delete({ where: { id } })
}
