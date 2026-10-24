import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config'
import authRoutes from './routes/auth.routes'
import studentRoutes from './routes/student.routes'
import academicRoutes from './routes/academic.routes'
import resultRoutes from './routes/result.routes'
import transcriptRoutes from './routes/transcript.routes'
import adminRoutes from './routes/admin.routes'
import studentPortalRoutes from './routes/portal.routes'
import usersRoutes from './routes/users.routes'
import { notFound, errorHandler } from './middlewares/error'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'BATMS API is healthy', data: { status: 'ok' } })
})

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api', academicRoutes)
app.use('/api/results', resultRoutes)
app.use('/api/transcript', transcriptRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/student', studentPortalRoutes)
app.use('/api/users', usersRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
