import { Router } from 'express'
import {
  handleGetTranscript,
  handleGetTranscriptPdf,
  handleGetClassReport,
  handleGetClassReportPdf,
} from '../controllers/transcript.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'

const router = Router()

router.use(authenticate)

router.get('/class/:classId', requireAdmin, handleGetClassReport)
router.get('/class/:classId/pdf', requireAdmin, handleGetClassReportPdf)
router.get('/:studentId', handleGetTranscript)
router.get('/:studentId/pdf', handleGetTranscriptPdf)

export default router
