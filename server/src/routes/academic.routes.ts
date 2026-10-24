import { Router } from 'express'
import {
  handleListClasses,
  handleCreateClass,
  handleUpdateClass,
  handleDeleteClass,
  handleListSubjects,
  handleCreateSubject,
  handleUpdateSubject,
  handleDeleteSubject,
  handleListSessions,
  handleCreateSession,
  handleUpdateSession,
  handleSetCurrentSession,
  handleDeleteSession,
  handleListTerms,
  handleCreateTerm,
  handleUpdateTerm,
  handleDeleteTerm,
} from '../controllers/academic.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'
import type { RequestHandler } from 'express'

const router = Router()

const adminGuard: RequestHandler[] = [authenticate, requireAdmin]

router.get('/classes', adminGuard, handleListClasses)
router.post('/classes', adminGuard, handleCreateClass)
router.put('/classes/:id', adminGuard, handleUpdateClass)
router.delete('/classes/:id', adminGuard, handleDeleteClass)

router.get('/subjects', adminGuard, handleListSubjects)
router.post('/subjects', adminGuard, handleCreateSubject)
router.put('/subjects/:id', adminGuard, handleUpdateSubject)
router.delete('/subjects/:id', adminGuard, handleDeleteSubject)

router.get('/sessions', adminGuard, handleListSessions)
router.post('/sessions', adminGuard, handleCreateSession)
router.put('/sessions/:id', adminGuard, handleUpdateSession)
router.post('/sessions/:id/set-current', adminGuard, handleSetCurrentSession)
router.delete('/sessions/:id', adminGuard, handleDeleteSession)

router.get('/terms', adminGuard, handleListTerms)
router.post('/terms', adminGuard, handleCreateTerm)
router.put('/terms/:id', adminGuard, handleUpdateTerm)
router.delete('/terms/:id', adminGuard, handleDeleteTerm)

export default router
