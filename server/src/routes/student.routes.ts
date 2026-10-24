import { Router } from 'express'
import {
  handleListStudents,
  handleGetStudent,
  handleCreateStudent,
  handleUpdateStudent,
  handleDeleteStudent,
  handleUploadPhoto,
  handleExportClassResults,
} from '../controllers/student.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'
import { uploadPhoto } from '../middlewares/upload'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/', handleListStudents)
router.get('/export', handleExportClassResults)
router.post('/', handleCreateStudent)
router.get('/:id', handleGetStudent)
router.put('/:id', handleUpdateStudent)
router.delete('/:id', handleDeleteStudent)
router.post('/:id/photo', uploadPhoto.single('photo'), handleUploadPhoto)

export default router
