import { Router } from 'express'
import {
  handleListUsers,
  handleResetUserPassword,
  handleDeleteUser,
} from '../controllers/user.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/', handleListUsers)
router.put('/:id/reset-password', handleResetUserPassword)
router.delete('/:id', handleDeleteUser)

export default router
