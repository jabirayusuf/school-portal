import type { Request, Response } from 'express'
import { adminStats, studentStats } from '../services/stats.service'
import { listResults } from '../services/result.service'
import { ok } from '../utils/response'

export async function handleAdminStats(_req: Request, res: Response): Promise<void> {
  ok(res, 'Dashboard stats', await adminStats())
}

export async function handleStudentStats(req: Request, res: Response): Promise<void> {
  ok(res, 'Student stats', await studentStats(req.user!.id))
}

export async function handleStudentRecentResults(req: Request, res: Response): Promise<void> {
  const data = await listResults({ page: 1, pageSize: 6, onlyMine: req.user!.studentId ?? undefined })
  ok(res, 'Recent results', data.items)
}
