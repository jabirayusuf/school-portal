export interface GradeResult {
  grade: string
  remark: string
}

export function calculateGrade(total: number): GradeResult {
  if (total >= 75) return { grade: 'A', remark: 'Excellent' }
  if (total >= 65) return { grade: 'B', remark: 'Very Good' }
  if (total >= 55) return { grade: 'C', remark: 'Good' }
  if (total >= 45) return { grade: 'D', remark: 'Fair' }
  if (total >= 40) return { grade: 'E', remark: 'Pass' }
  return { grade: 'F', remark: 'Fail' }
}
