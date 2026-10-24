import type { Request, Response } from 'express'
import { getTranscriptData, getClassReport, type TranscriptFilters } from '../services/transcript.service'
import { generateTranscriptPdf, generateClassReportPdf } from '../services/pdf.service'
import { AppError, ok } from '../utils/response'

function parseTranscriptFilters(req: Request): TranscriptFilters {
  const filters: TranscriptFilters = {}
  const sessionId = Number(req.query.sessionId)
  const termId = Number(req.query.termId)
  if (req.query.sessionId !== undefined && !Number.isNaN(sessionId)) filters.sessionId = sessionId
  if (req.query.termId !== undefined && !Number.isNaN(termId)) filters.termId = termId
  return filters
}

export async function handleGetTranscript(req: Request, res: Response): Promise<void> {
  const studentId = Number(req.params.studentId)
  if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
    throw new AppError('You can only view your own transcript', 403)
  }
  const transcript = await getTranscriptData(studentId, parseTranscriptFilters(req))
  ok(res, 'Transcript retrieved', transcript)
}

export async function handleGetTranscriptPdf(req: Request, res: Response): Promise<void> {
  const studentId = Number(req.params.studentId)
  if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
    throw new AppError('You can only download your own transcript', 403)
  }
  const filters = parseTranscriptFilters(req)
  const transcript = await getTranscriptData(studentId, filters)
  const pdf = await generateTranscriptPdf(transcript)
  const termLabel = filters.termId ? transcript.sessions[0]?.terms[0]?.termName ?? 'term' : null
  const filename = `transcript-${transcript.student.admissionNumber}${termLabel ? `-${termLabel.replace(/[^\w-]+/g, '_')}` : ''}.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(pdf)
}

export async function handleGetClassReport(req: Request, res: Response): Promise<void> {
  const classId = Number(req.params.classId)
  const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined
  const report = await getClassReport(classId, sessionId)
  ok(res, 'Class report retrieved', report)
}

export async function handleGetClassReportPdf(req: Request, res: Response): Promise<void> {
  const classId = Number(req.params.classId)
  const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined
  const report = await getClassReport(classId, sessionId)
  const pdf = await generateClassReportPdf(report)
  const sessionLabel = report.session?.name.replace(/[^\w-]+/g, '_') ?? 'All_Sessions'
  const filename = `${report.class.name.replace(/[^\w-]+/g, '_')}_${sessionLabel}_report.pdf`
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(pdf)
}
