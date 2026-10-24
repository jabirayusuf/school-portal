import { Router } from 'express'
import { handleAdminStats } from '../controllers/stats.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'

const router = Router()

router.use(authenticate, requireAdmin)
router.get('/stats', handleAdminStats)

export default router
