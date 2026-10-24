import type { Request, Response } from 'express'
import {
  sessionSchema,
  termSchema,
  subjectSchema,
  classSchema,
} from '../validators/academic.validator'
import * as academic from '../services/academic.service'
import { ok } from '../utils/response'

export async function handleListClasses(_req: Request, res: Response): Promise<void> {
  ok(res, 'Classes retrieved', await academic.listClasses())
}

export async function handleCreateClass(req: Request, res: Response): Promise<void> {
  const body = classSchema.parse(req.body)
  ok(res, 'Class created successfully', await academic.createClass(body.name), 201)
}

export async function handleUpdateClass(req: Request, res: Response): Promise<void> {
  const body = classSchema.parse(req.body)
  ok(res, 'Class updated successfully', await academic.updateClass(Number(req.params.id), body.name))
}

export async function handleDeleteClass(req: Request, res: Response): Promise<void> {
  await academic.deleteClass(Number(req.params.id))
  ok(res, 'Class deleted successfully', null)
}

export async function handleListSubjects(_req: Request, res: Response): Promise<void> {
  ok(res, 'Subjects retrieved', await academic.listSubjects())
}

export async function handleCreateSubject(req: Request, res: Response): Promise<void> {
  const body = subjectSchema.parse(req.body)
  ok(res, 'Subject created successfully', await academic.createSubject(body.name, body.code), 201)
}

export async function handleUpdateSubject(req: Request, res: Response): Promise<void> {
  const body = subjectSchema.parse(req.body)
  ok(res, 'Subject updated successfully', await academic.updateSubject(Number(req.params.id), body.name, body.code))
}

export async function handleDeleteSubject(req: Request, res: Response): Promise<void> {
  await academic.deleteSubject(Number(req.params.id))
  ok(res, 'Subject deleted successfully', null)
}

export async function handleListSessions(_req: Request, res: Response): Promise<void> {
  ok(res, 'Sessions retrieved', await academic.listSessions())
}

export async function handleCreateSession(req: Request, res: Response): Promise<void> {
  const body = sessionSchema.parse(req.body)
  ok(res, 'Session created successfully', await academic.createSession(body.name, body.isCurrent), 201)
}

export async function handleUpdateSession(req: Request, res: Response): Promise<void> {
  const body = sessionSchema.parse(req.body)
  ok(res, 'Session updated successfully', await academic.updateSession(Number(req.params.id), body.name, body.isCurrent))
}

export async function handleSetCurrentSession(req: Request, res: Response): Promise<void> {
  ok(res, 'Current session updated', await academic.setCurrentSession(Number(req.params.id)))
}

export async function handleDeleteSession(req: Request, res: Response): Promise<void> {
  await academic.deleteSession(Number(req.params.id))
  ok(res, 'Session deleted successfully', null)
}

export async function handleListTerms(_req: Request, res: Response): Promise<void> {
  ok(res, 'Terms retrieved', await academic.listTerms())
}

export async function handleCreateTerm(req: Request, res: Response): Promise<void> {
  const body = termSchema.parse(req.body)
  ok(res, 'Term created successfully', await academic.createTerm(body.name, body.sessionId), 201)
}

export async function handleUpdateTerm(req: Request, res: Response): Promise<void> {
  const body = termSchema.parse(req.body)
  ok(res, 'Term updated successfully', await academic.updateTerm(Number(req.params.id), body.name, body.sessionId))
}

export async function handleDeleteTerm(req: Request, res: Response): Promise<void> {
  await academic.deleteTerm(Number(req.params.id))
  ok(res, 'Term deleted successfully', null)
}
