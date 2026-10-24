import * as XLSX from 'xlsx'

export const RESULTS_TEMPLATE_COLUMNS = [
  'Admission Number',
  'Session',
  'Term',
  'Subject',
  'CA',
  'Exam',
] as const

export interface ResultsTemplateOptions {
  rows?: number
  session?: string
  term?: string
}

export function buildResultsTemplate(options: ResultsTemplateOptions = {}): Buffer {
  const { rows = 50, session = '', term = '' } = options
  const rowData = Array.from({ length: rows }, (_, i) => ({
    'Admission Number': `BA${String(i + 1).padStart(3, '0')}`,
    Session: session,
    Term: term,
    Subject: '',
    CA: '',
    Exam: '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rowData, {
    header: [...RESULTS_TEMPLATE_COLUMNS],
  })
  worksheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 8 }, { wch: 8 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Results')
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
