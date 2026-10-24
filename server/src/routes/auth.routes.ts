import { Router } from 'express'
import {
  handleLogin,
  handleLogout,
  handleMe,
  handleChangePassword,
} from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth'

const router = Router()

router.post('/login', handleLogin)
router.post('/logout', authenticate, handleLogout)
router.get('/me', authenticate, handleMe)
router.put('/password', authenticate, handleChangePassword)

export default router
