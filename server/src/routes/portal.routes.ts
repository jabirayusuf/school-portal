import { Router } from 'express'
import { handleStudentStats } from '../controllers/stats.controller'
import { authenticate, requireStudent } from '../middlewares/auth'

const router = Router()

router.use(authenticate, requireStudent)
router.get('/stats', handleStudentStats)

export default router
