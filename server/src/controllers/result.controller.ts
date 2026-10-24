import type { Request, Response } from 'express'
import { resultSchema } from '../validators/result.validator'
import { listResults, createResult, updateResult, deleteResult } from '../services/result.service'
import { importResultsFromFile } from '../services/excel.service'
import { buildResultsTemplate } from '../services/template.service'
import prisma from '../prisma'
import { ok } from '../utils/response'

export async function handleDownloadTemplate(_req: Request, res: Response): Promise<void> {
  const currentSession = await prisma.session.findFirst({ where: { isCurrent: true } })
  const firstTerm = await prisma.term.findFirst({ orderBy: { id: 'asc' } })
  const buffer = buildResultsTemplate({
    rows: 50,
    session: currentSession?.name ?? '',
    term: firstTerm?.name ?? 'First',
  })
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader('Content-Disposition', 'attachment; filename="results-template.xlsx"')
  res.send(buffer)
}

export async function handleListResults(req: Request, res: Response): Promise<void> {
  const query = {
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
    sessionId: req.query.sessionId ? Number(req.query.sessionId) : undefined,
    termId: req.query.termId ? Number(req.query.termId) : undefined,
    classId: req.query.classId ? Number(req.query.classId) : undefined,
    onlyMine: req.user?.role === 'STUDENT' ? req.user.studentId ?? undefined : undefined,
  }
  const data = await listResults(query)
  ok(res, 'Results retrieved', data)
}

export async function handleCreateResult(req: Request, res: Response): Promise<void> {
  const body = resultSchema.parse(req.body)
  const result = await createResult(body)
  ok(res, 'Result recorded successfully', result, 201)
}

export async function handleUpdateResult(req: Request, res: Response): Promise<void> {
  const body = resultSchema.parse(req.body)
  const result = await updateResult(Number(req.params.id), body)
  ok(res, 'Result updated successfully', result)
}

export async function handleDeleteResult(req: Request, res: Response): Promise<void> {
  await deleteResult(Number(req.params.id))
  ok(res, 'Result deleted successfully', null)
}

export async function handleUploadResults(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    ok(res, 'No file uploaded', null, 400)
    return
  }
  const summary = await importResultsFromFile(req.file.path)
  ok(res, 'Results imported successfully', summary)
}
