import fs from 'node:fs'
import * as XLSX from 'xlsx'
import prisma from '../prisma'
import { AppError } from '../utils/response'
import { calculateGrade } from '../utils/grade'

export async function buildClassResultsWorkbook(
  classId: number,
  sessionId: number,
  termId: number,
): Promise<Buffer> {
  const [klass, session, term] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.session.findUnique({ where: { id: sessionId } }),
    prisma.term.findUnique({ where: { id: termId } }),
  ])
  if (!klass) throw new AppError('Class not found', 404)
  if (!session) throw new AppError('Session not found', 404)
  if (!term) throw new AppError('Term not found', 404)

  const [students, subjects, results] = await Promise.all([
    prisma.student.findMany({
      where: { classId },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
    }),
    prisma.subject.findMany({
      where: {
        results: { some: { sessionId, termId, student: { classId } } },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.result.findMany({
      where: { sessionId, termId, student: { classId } },
      select: { studentId: true, subjectId: true, ca: true, exam: true },
    }),
  ])

  const resultMap = new Map<string, { ca: number; exam: number }>()
  for (const r of results) {
    resultMap.set(`${r.studentId}:${r.subjectId}`, { ca: r.ca, exam: r.exam })
  }

  const rows: Array<Array<string | number>> = [
    [
      'First Name',
      'Middle Name',
      'Last Name',
      'Admission No.',
      ...subjects.flatMap((s) => [`${s.name} CA`, `${s.name} Exam`]),
    ],
  ]
  for (const student of students) {
    const row: Array<string | number> = [
      student.firstName,
      student.middleName ?? '',
      student.lastName,
      student.admissionNumber,
    ]
    for (const subject of subjects) {
      const result = resultMap.get(`${student.id}:${subject.id}`)
      row.push(result ? result.ca : '')
      row.push(result ? result.exam : '')
    }
    rows.push(row)
  }

  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Class Results')
  const out = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return Buffer.from(out)
}

export interface ImportError {
  row: number
  message: string
}

export interface ImportSummary {
  total: number
  imported: number
  skipped: number
  errors: ImportError[]
}

interface RowInput {
  admissionNumber?: string
  session?: string
  term?: string
  subject?: string
  ca?: number
  exam?: number
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z]/g, '')
}

function parseRow(raw: Record<string, unknown>): RowInput {
  const row: RowInput = {}
  for (const [key, value] of Object.entries(raw)) {
    const header = normalizeHeader(key)
    if (header.includes('admission')) row.admissionNumber = String(value ?? '').trim()
    if (header === 'session') row.session = String(value ?? '').trim()
    if (header === 'term') row.term = String(value ?? '').trim()
    if (header === 'subject') row.subject = String(value ?? '').trim()
    if (header === 'ca') row.ca = Number(value)
    if (header === 'exam') row.exam = Number(value)
  }
  return row
}

export async function importResultsFromFile(filePath: string): Promise<ImportSummary> {
  if (!fs.existsSync(filePath)) throw new AppError('Uploaded file not found', 400)
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new AppError('The file does not contain any sheets', 400)
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const rows = rawRows.map(parseRow)

  const summary: ImportSummary = { total: rows.length, imported: 0, skipped: 0, errors: [] }

  const errors: ImportError[] = []
  const valid: Array<RowInput & { originalIndex: number }> = []

  rows.forEach((row, index) => {
    const line = index + 2
    if (!row.admissionNumber) errors.push({ row: line, message: 'Admission Number is missing' })
    else if (!row.session) errors.push({ row: line, message: 'Session is missing' })
    else if (!row.term) errors.push({ row: line, message: 'Term is missing' })
    else if (!row.subject) errors.push({ row: line, message: 'Subject is missing' })
    else if (row.ca === undefined || Number.isNaN(row.ca) || row.ca < 0 || row.ca > 40) {
      errors.push({ row: line, message: 'CA must be a number between 0 and 40' })
    } else if (row.exam === undefined || Number.isNaN(row.exam) || row.exam < 0 || row.exam > 60) {
      errors.push({ row: line, message: 'Exam must be a number between 0 and 60' })
    } else {
      valid.push({ ...row, ca: row.ca as number, exam: row.exam as number, originalIndex: index })
    }
  })

  const studentMap = new Map<string, number>()
  const sessionMap = new Map<string, number>()
  const subjectMap = new Map<string, number>()
  const termMap = new Map<string, Map<string, number>>()

  const students = await prisma.student.findMany({ select: { id: true, admissionNumber: true } })
  for (const s of students) studentMap.set(s.admissionNumber.toLowerCase(), s.id)

  const sessions = await prisma.session.findMany({ select: { id: true, name: true } })
  for (const s of sessions) sessionMap.set(s.name.toLowerCase(), s.id)

  const subjects = await prisma.subject.findMany({ select: { id: true, name: true, code: true } })
  for (const s of subjects) {
    subjectMap.set(s.name.toLowerCase(), s.id)
    subjectMap.set(s.code.toLowerCase(), s.id)
  }

  const terms = await prisma.term.findMany({ select: { id: true, name: true, sessionId: true } })
  for (const t of terms) {
    if (!termMap.has(t.name.toLowerCase())) termMap.set(t.name.toLowerCase(), new Map())
    termMap.get(t.name.toLowerCase())!.set(String(t.sessionId), t.id)
  }

  const existingResults = new Set<string>()
  const results = await prisma.result.findMany({
    select: { studentId: true, sessionId: true, termId: true, subjectId: true },
  })
  for (const r of results) {
    existingResults.add(`${r.studentId}:${r.sessionId}:${r.termId}:${r.subjectId}`)
  }

  const seen = new Set<string>()
  let imported = 0
  const createManyData: Array<{
    studentId: number
    subjectId: number
    sessionId: number
    termId: number
    ca: number
    exam: number
    total: number
    grade: string
    remark: string
  }> = []

  for (const row of valid) {
    const line = row.originalIndex + 2
    const studentId = studentMap.get(row.admissionNumber!.toLowerCase())
    if (!studentId) {
      errors.push({ row: line, message: `Unknown admission number "${row.admissionNumber}"` })
      continue
    }
    const sessionId = sessionMap.get(row.session!.toLowerCase())
    if (!sessionId) {
      errors.push({ row: line, message: `Unknown session "${row.session}"` })
      continue
    }
    const subjectId = subjectMap.get(row.subject!.toLowerCase())
    if (!subjectId) {
      errors.push({ row: line, message: `Unknown subject "${row.subject}"` })
      continue
    }
    const termSessionMap = termMap.get(row.term!.toLowerCase())
    const termId = termSessionMap?.get(String(sessionId))
    if (!termId) {
      errors.push({
        row: line,
        message: `Unknown term "${row.term}" for session "${row.session}"`,
      })
      continue
    }
    const key = `${studentId}:${sessionId}:${termId}:${subjectId}`
    if (existingResults.has(key) || seen.has(key)) {
      errors.push({
        row: line,
        message: 'Duplicate result (student, session, term, subject already exists)',
      })
      continue
    }
    seen.add(key)
    const total = (row.ca as number) + (row.exam as number)
    const { grade, remark } = calculateGrade(total)
    createManyData.push({
      studentId,
      subjectId,
      sessionId,
      termId,
      ca: row.ca as number,
      exam: row.exam as number,
      total,
      grade,
      remark,
    })
    imported++
  }

  if (createManyData.length > 0) {
    await prisma.result.createMany({ data: createManyData })
  }

  summary.imported = imported
  summary.skipped = errors.length
  summary.errors = errors

  try {
    fs.unlinkSync(filePath)
  } catch {
    // ignore cleanup failure
  }

  return summary
}
