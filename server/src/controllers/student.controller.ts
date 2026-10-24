import type { Request, Response } from 'express'
import { studentSchema } from '../validators/student.validator'
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadStudentPhoto,
} from '../services/student.service'
import { ok } from '../utils/response'
import { buildClassResultsWorkbook } from '../services/excel.service'
import { AppError } from '../utils/response'

export async function handleListStudents(req: Request, res: Response): Promise<void> {
  const query = {
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    classId: req.query.classId ? Number(req.query.classId) : undefined,
    gender: typeof req.query.gender === 'string' ? req.query.gender : undefined,
  }
  const data = await listStudents(query)
  ok(res, 'Students retrieved', data)
}

export async function handleGetStudent(req: Request, res: Response): Promise<void> {
  const student = await getStudent(Number(req.params.id))
  ok(res, 'Student retrieved', student)
}

export async function handleCreateStudent(req: Request, res: Response): Promise<void> {
  const body = studentSchema.parse(req.body)
  const student = await createStudent(body)
  ok(res, 'Student created successfully', student, 201)
}

export async function handleUpdateStudent(req: Request, res: Response): Promise<void> {
  const body = studentSchema.parse(req.body)
  const student = await updateStudent(Number(req.params.id), body)
  ok(res, 'Student updated successfully', student)
}

export async function handleDeleteStudent(req: Request, res: Response): Promise<void> {
  await deleteStudent(Number(req.params.id))
  ok(res, 'Student deleted successfully', null)
}

export async function handleUploadPhoto(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    ok(res, 'No file uploaded', null, 400)
    return
  }
  const student = await uploadStudentPhoto(Number(req.params.id), req.file)
  ok(res, 'Photo uploaded successfully', student)
}

export async function handleExportClassResults(req: Request, res: Response): Promise<void> {
  const classId = Number(req.query.classId)
  const sessionId = Number(req.query.sessionId)
  const termId = Number(req.query.termId)
  if (!classId || !sessionId || !termId) {
    throw new AppError('classId, sessionId and termId are required', 400)
  }
  const buffer = await buildClassResultsWorkbook(classId, sessionId, termId)
  const filename = `class-results-${classId}-${sessionId}-${termId}.xlsx`
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(buffer)
}
