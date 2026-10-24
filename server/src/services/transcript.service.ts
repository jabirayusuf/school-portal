import prisma from '../prisma'
import { AppError } from '../utils/response'
import type {
  ClassReport,
  TranscriptData,
  TranscriptResult,
  TranscriptTerm,
  TranscriptSession,
} from './transcript.types'

interface StudentStat {
  average: number
  count: number
}

function computeStats(
  results: Array<{ studentId: number; total: number }>,
): Map<number, StudentStat> {
  const stats = new Map<number, StudentStat>()
  for (const r of results) {
    const cur = stats.get(r.studentId) ?? { average: 0, count: 0 }
    cur.average += r.total
    cur.count += 1
    stats.set(r.studentId, cur)
  }
  for (const [, s] of stats) {
    s.average = s.average / s.count
  }
  return stats
}

function rankStudents(stats: Map<number, StudentStat>): Map<number, number> {
  const sorted = [...stats.entries()].sort((a, b) => b[1].average - a[1].average)
  const positions = new Map<number, number>()
  let prevAverage: number | null = null
  let prevPosition = 0
  sorted.forEach(([sid, s], i) => {
    if (prevAverage === null || s.average < prevAverage) {
      prevPosition = i + 1
      prevAverage = s.average
    }
    positions.set(sid, prevPosition)
  })
  return positions
}

async function getPositionsForScope(
  classId: number,
  scope: TranscriptFilters = {},
): Promise<Map<number, number>> {
  const results = await prisma.result.findMany({
    where: {
      student: { classId },
      ...(scope.sessionId ? { sessionId: scope.sessionId } : {}),
      ...(scope.termId ? { termId: scope.termId } : {}),
    },
    select: { studentId: true, total: true },
  })
  return rankStudents(computeStats(results))
}

export interface TranscriptFilters {
  sessionId?: number
  termId?: number
}

export async function getTranscriptData(
  studentId: number,
  filters: TranscriptFilters = {},
): Promise<TranscriptData> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { klass: true },
  })
  if (!student) throw new AppError('Student not found', 404)

  const results = await prisma.result.findMany({
    where: {
      studentId,
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.termId ? { termId: filters.termId } : {}),
    },
    include: { subject: true, session: true, term: true },
    orderBy: [{ session: { createdAt: 'asc' } }, { termId: 'asc' }, { subject: { name: 'asc' } }],
  })

  const classId = student.classId
  const sessionIds = [...new Set(results.map((r) => r.sessionId))]
  const sessionPositions = new Map<number, Map<number, number>>()
  for (const sid of sessionIds) {
    sessionPositions.set(sid, await getPositionsForScope(classId, { ...filters, sessionId: sid }))
  }
  const overallPositions = await getPositionsForScope(classId, filters)

  const sessionsMap = new Map<
    number,
    { sessionId: number; sessionName: string; terms: Map<number, TranscriptTerm> }
  >()

  for (const r of results) {
    const row: TranscriptResult = {
      subject: r.subject.name,
      code: r.subject.code,
      ca: r.ca,
      exam: r.exam,
      total: r.total,
      grade: r.grade,
      remark: r.remark,
    }
    if (!sessionsMap.has(r.sessionId)) {
      sessionsMap.set(r.sessionId, {
        sessionId: r.sessionId,
        sessionName: r.session.name,
        terms: new Map(),
      })
    }
    const session = sessionsMap.get(r.sessionId)!
    const term = session.terms.get(r.termId)
    if (term) {
      term.results.push(row)
    } else {
      session.terms.set(r.termId, {
        termId: r.termId,
        termName: r.term.name,
        average: 0,
        results: [row],
      })
    }
  }

  const sessions: TranscriptSession[] = Array.from(sessionsMap.values())
    .sort((a, b) => a.sessionId - b.sessionId)
    .map((s) => {
      const terms = Array.from(s.terms.values())
        .sort((a, b) => a.termId - b.termId)
        .map((t) => ({
          ...t,
          average:
            t.results.length > 0
              ? t.results.reduce((sum, res) => sum + res.total, 0) / t.results.length
              : 0,
        }))
      const allTotals = terms.flatMap((t) => t.results.map((res) => res.total))
      const average =
        allTotals.length > 0 ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0
      return {
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        average,
        position: sessionPositions.get(s.sessionId)?.get(student.id) ?? null,
        terms,
      }
    })

  const allTotals = sessions.flatMap((s) => s.terms.flatMap((t) => t.results.map((r) => r.total)))
  const overallAverage =
    allTotals.length > 0 ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0

  return {
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gender: student.gender,
      klass: student.klass ? { id: student.klass.id, name: student.klass.name } : null,
      graduationYear: student.graduationYear,
    },
    sessions,
    overallAverage,
    overallPosition: overallPositions.get(student.id) ?? null,
    totalResults: results.length,
  }
}

export async function getClassReport(
  classId: number,
  sessionId?: number,
): Promise<ClassReport> {
  const klass = await prisma.class.findUnique({ where: { id: classId } })
  if (!klass) throw new AppError('Class not found', 404)

  let session: { id: number; name: string } | null = null
  if (sessionId) {
    const found = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!found) throw new AppError('Session not found', 404)
    session = { id: found.id, name: found.name }
  }

  const where = {
    student: { classId },
    ...(session ? { sessionId: session.id } : {}),
  }

  const [results, students] = await Promise.all([
    prisma.result.findMany({ where, select: { studentId: true, total: true } }),
    prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
    }),
  ])

  const stats = computeStats(results)
  const positions = rankStudents(stats)

  const reportStudents = students
    .filter((s) => stats.has(s.id))
    .map((s) => ({
      student: s,
      average: stats.get(s.id)!.average,
      position: positions.get(s.id)!,
    }))
    .sort((a, b) => a.position - b.position || a.student.firstName.localeCompare(b.student.firstName))

  return {
    class: { id: klass.id, name: klass.name },
    session,
    students: reportStudents,
  }
}
