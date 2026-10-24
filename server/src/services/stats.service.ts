import prisma from '../prisma'
import { AppError } from '../utils/response'

export async function adminStats() {
  const [studentCount, subjectCount, sessionCount, resultCount, classCount] = await Promise.all([
    prisma.student.count(),
    prisma.subject.count(),
    prisma.session.count(),
    prisma.result.count(),
    prisma.class.count(),
  ])
  const [currentSession, recentStudents, recentResults] = await Promise.all([
    prisma.session.findFirst({ where: { isCurrent: true } }),
    prisma.student.findMany({ include: { klass: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.result.findMany({
      include: { student: true, subject: true, session: true, term: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ])
  return {
    studentCount,
    subjectCount,
    sessionCount,
    resultCount,
    classCount,
    currentSession,
    recentStudents,
    recentResults,
  }
}

export async function studentStats(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.studentId) throw new AppError('Student account not linked', 400)

  const student = await prisma.student.findUnique({
    where: { id: user.studentId },
    include: { klass: true },
  })
  if (!student) throw new AppError('Student not found', 404)

  const results = await prisma.result.findMany({
    where: { studentId: user.studentId },
    include: { subject: true, session: true, term: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalResults = results.length
  const overallAverage =
    totalResults > 0
      ? results.reduce((sum, r) => sum + r.total, 0) / totalResults
      : null
  const latestSession = results[0]?.session?.name ?? null

  return {
    overallAverage,
    latestSession,
    totalResults,
    student,
    recentResults: results.slice(0, 6),
  }
}
