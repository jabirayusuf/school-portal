import { Router } from 'express'
import {
  handleListResults,
  handleCreateResult,
  handleUpdateResult,
  handleDeleteResult,
  handleUploadResults,
  handleDownloadTemplate,
} from '../controllers/result.controller'
import { authenticate, requireAdmin } from '../middlewares/auth'
import { uploadExcel } from '../middlewares/upload'

const router = Router()

router.use(authenticate)

router.get('/', handleListResults)
router.get('/template', requireAdmin, handleDownloadTemplate)
router.post('/', requireAdmin, handleCreateResult)
router.put('/:id', requireAdmin, handleUpdateResult)
router.delete('/:id', requireAdmin, handleDeleteResult)
router.post('/upload', requireAdmin, uploadExcel.single('file'), handleUploadResults)

export default router
