export interface TranscriptResult {
  subject: string
  code: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

export interface TranscriptTerm {
  termId: number
  termName: string
  average: number
  results: TranscriptResult[]
}

export interface TranscriptSession {
  sessionId: number
  sessionName: string
  average: number
  position: number | null
  terms: TranscriptTerm[]
}

export interface TranscriptStudent {
  id: number
  admissionNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  gender: string
  klass: { id: number; name: string } | null
  graduationYear: number | null
}

export interface TranscriptData {
  student: TranscriptStudent
  sessions: TranscriptSession[]
  overallAverage: number
  overallPosition: number | null
  totalResults: number
}

export interface ClassReportStudent {
  student: {
    id: number
    admissionNumber: string
    firstName: string
    middleName: string | null
    lastName: string
  }
  average: number
  position: number
}

export interface ClassReport {
  class: { id: number; name: string }
  session: { id: number; name: string } | null
  students: ClassReportStudent[]
}
