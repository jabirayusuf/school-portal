import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { ClassReport, TranscriptData } from './transcript.types'
import { AppError } from '../utils/response'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 48
const TABLE_W = PAGE_W - MARGIN * 2
const COLUMNS = [
  { label: 'Subject', width: 0.32 },
  { label: 'Code', width: 0.1 },
  { label: 'CA', width: 0.1 },
  { label: 'Exam', width: 0.1 },
  { label: 'Total', width: 0.1 },
  { label: 'Grade', width: 0.1 },
  { label: 'Remark', width: 0.18 },
]

const blue = rgb(0.145, 0.388, 0.922)
const dark = rgb(0.06, 0.09, 0.16)
const muted = rgb(0.39, 0.42, 0.48)
const light = rgb(0.92, 0.94, 0.98)
const border = rgb(0.85, 0.87, 0.9)

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  color = dark,
  align: 'left' | 'center' | 'right' = 'left',
) {
  let startX = x
  const width = font.widthOfTextAtSize(text, size)
  if (align === 'center') startX = x - width / 2
  if (align === 'right') startX = x - width
  page.drawText(text, { x: startX, y, size, font, color })
  return width
}

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxWidth) {
    t = t.slice(0, -1)
  }
  return t + '…'
}

function ordinal(value: number | null): string {
  if (value === null) return '—'
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = value % 100
  return value + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0])
}

export async function generateTranscriptPdf(transcript: TranscriptData): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const headerY = y
  drawText(page, bold, 'BRILLIANTS ACADEMY', PAGE_W / 2, headerY - 8, 18, blue, 'center')
  drawText(page, font, 'Jos, Plateau State, Nigeria', PAGE_W / 2, headerY - 24, 10, muted, 'center')
  drawText(page, bold, 'ACADEMIC TRANSCRIPT', PAGE_W / 2, headerY - 40, 11, dark, 'center')
  page.drawLine({ start: { x: MARGIN, y: headerY - 52 }, end: { x: PAGE_W - MARGIN, y: headerY - 52 }, thickness: 2, color: blue })
  y = headerY - 72

  const s = transcript.student
  const infoRows: Array<[string, string]> = [
    ['Student', `${s.firstName} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName}`],
    ['Admission Number', s.admissionNumber],
    ['Class', s.klass?.name ?? '—'],
    ['Graduation Year', s.graduationYear ? String(s.graduationYear) : '—'],
    ['Gender', s.gender],
  ]
  for (const [label, value] of infoRows) {
    drawText(page, bold, label, MARGIN, y, 10, muted)
    drawText(page, font, value, MARGIN + 140, y, 10, dark)
    y -= 16
  }
  y -= 12

  for (const session of transcript.sessions) {
    for (const term of session.terms) {
      const headerText = `${session.sessionName} Session - ${term.termName} Term`
      drawText(page, bold, headerText, MARGIN, y, 11, dark)
      y -= 6

      const rowHeight = 20
      const tableTop = y - rowHeight

      if (tableTop < MARGIN + 40) {
        page = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
        drawText(page, bold, headerText, MARGIN, y, 11, dark)
        y -= 6
      }

      const colX: number[] = []
      let x = MARGIN
      for (const col of COLUMNS) {
        colX.push(x)
        x += col.width * TABLE_W
      }
      const right = x

      page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: TABLE_W, height: rowHeight, color: light })
      COLUMNS.forEach((col, i) => {
        const align: 'left' | 'center' = i === 0 || i === 6 ? 'left' : 'center'
        const cx = colX[i] + (align === 'center' ? col.width * TABLE_W / 2 : 4)
        drawText(page, bold, col.label, cx, y - 14, 9, dark, align === 'center' ? 'center' : 'left')
      })
      y -= rowHeight

      for (const res of term.results) {
        const values = [res.subject, res.code, String(res.ca), String(res.exam), String(res.total), res.grade, res.remark]
        if (y - rowHeight < MARGIN) {
          page = doc.addPage([PAGE_W, PAGE_H])
          y = PAGE_H - MARGIN
        }
        page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: border })
        COLUMNS.forEach((col, i) => {
          const align: 'left' | 'center' = i === 0 || i === 6 ? 'left' : 'center'
          let value = values[i]
          if (i === 0 || i === 6) {
            value = truncate(value, font, 9, col.width * TABLE_W - 8)
          }
          const cx = colX[i] + (align === 'center' ? col.width * TABLE_W / 2 : 4)
          drawText(page, font, value, cx, y - 14, 9, dark, align === 'center' ? 'center' : 'left')
        })
        y -= rowHeight
      }

      page.drawLine({ start: { x: MARGIN, y: y + 0.5 }, end: { x: right, y: y + 0.5 }, thickness: 0.5, color: border })

      drawText(page, font, `Term Average: ${term.average.toFixed(2)}%`, right, y - 14, 9, muted, 'right')
      y -= 26

      if (y < MARGIN + 60) {
        page = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
      }
    }

    drawText(page, bold, `Session Average: ${session.average.toFixed(2)}%`, MARGIN + TABLE_W, y - 8, 10, dark, 'right')
    drawText(page, bold, `Position: ${ordinal(session.position)}`, MARGIN, y - 8, 10, dark)
    page.drawLine({ start: { x: MARGIN, y: y - 16 }, end: { x: MARGIN + TABLE_W, y: y - 16 }, thickness: 0.5, color: border })
    y -= 30

    if (y < MARGIN + 60) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
  }

  if (transcript.sessions.length > 0) {
    if (y < MARGIN + 140) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
    }
    drawText(page, bold, 'SESSION SUMMARY', MARGIN, y, 11, dark)
    y -= 8

    const sumCols = [
      { label: 'Session', width: 0.5 },
      { label: 'Average (%)', width: 0.25 },
      { label: 'Position', width: 0.25 },
    ]
    const sumColX: number[] = []
    let sx = MARGIN
    for (const col of sumCols) {
      sumColX.push(sx)
      sx += col.width * TABLE_W
    }

    const sumRowHeight = 20
    const drawSumHeader = (p: PDFPage, py: number) => {
      p.drawRectangle({ x: MARGIN, y: py - sumRowHeight, width: TABLE_W, height: sumRowHeight, color: light })
      sumCols.forEach((col, i) => {
        const align: 'left' | 'center' = i === 0 ? 'left' : 'center'
        const cx = sumColX[i] + (align === 'center' ? col.width * TABLE_W / 2 : 4)
        drawText(p, bold, col.label, cx, py - 14, 9, dark, align === 'center' ? 'center' : 'left')
      })
    }

    drawSumHeader(page, y)
    y -= sumRowHeight

    for (const session of transcript.sessions) {
      if (y - sumRowHeight < MARGIN) {
        page = doc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
        drawSumHeader(page, y)
        y -= sumRowHeight
      }
      const values = [session.sessionName, session.average.toFixed(2), ordinal(session.position)]
      page.drawLine({ start: { x: MARGIN, y }, end: { x: sx, y }, thickness: 0.5, color: border })
      sumCols.forEach((col, i) => {
        const align: 'left' | 'center' = i === 0 ? 'left' : 'center'
        const cx = sumColX[i] + (align === 'center' ? col.width * TABLE_W / 2 : 4)
        drawText(page, font, values[i], cx, y - 14, 9, dark, align === 'center' ? 'center' : 'left')
      })
      y -= sumRowHeight
    }
    page.drawLine({ start: { x: MARGIN, y: y + 0.5 }, end: { x: sx, y: y + 0.5 }, thickness: 0.5, color: border })
    y -= 24
  }

  if (transcript.sessions.length === 0) {
    drawText(page, font, 'No results recorded for this student yet.', MARGIN, y, 10, muted)
    y -= 20
  }

  y -= 10
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: border })
  y -= 22
  drawText(page, bold, 'Overall Average', MARGIN, y, 11, dark)
  drawText(
    page,
    bold,
    transcript.totalResults ? `${transcript.overallAverage.toFixed(2)}%` : '—',
    MARGIN + 160,
    y,
    11,
    blue,
  )
  drawText(page, bold, 'Total Results', PAGE_W / 2 + 40, y, 11, dark)
  drawText(page, bold, String(transcript.totalResults), PAGE_W / 2 + 160, y, 11, blue)
  drawText(page, bold, 'Overall Position', PAGE_W - MARGIN - 140, y, 11, dark)
  drawText(page, bold, ordinal(transcript.overallPosition), PAGE_W - MARGIN, y, 11, blue, 'right')
  y -= 70

  if (y < MARGIN + 80) {
    page = doc.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN - 20
  }

  drawText(page, font, "Principal's Signature", PAGE_W - MARGIN - 160, y, 10, muted)
  page.drawLine({
    start: { x: PAGE_W - MARGIN - 160, y: y - 2 },
    end: { x: PAGE_W - MARGIN, y: y - 2 },
    thickness: 1,
    color: border,
  })

  const pageCount = doc.getPageCount()
  for (let i = 0; i < pageCount; i++) {
    const p = doc.getPage(i)
    const footer = `Generated electronically by Brilliants Academy Transcript Management System - Page ${i + 1} of ${pageCount}`
    drawText(p, font, footer, PAGE_W / 2, MARGIN - 24, 8, muted, 'center')
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}

export function transcriptToPdf(transcript: unknown): Promise<Buffer> {
  if (!isTranscript(transcript)) {
    throw new AppError('Invalid transcript data', 500)
  }
  return generateTranscriptPdf(transcript)
}

function isTranscript(value: unknown): value is TranscriptData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'student' in value &&
    'sessions' in value &&
    'overallAverage' in value &&
    'totalResults' in value
  )
}

export async function generateClassReportPdf(report: ClassReport): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = PAGE_H - MARGIN

  const headerY = y
  drawText(page, bold, 'BRILLIANTS ACADEMY', PAGE_W / 2, headerY - 8, 18, blue, 'center')
  drawText(page, font, 'Jos, Plateau State, Nigeria', PAGE_W / 2, headerY - 24, 10, muted, 'center')
  drawText(page, bold, 'CLASS PERFORMANCE REPORT', PAGE_W / 2, headerY - 40, 11, dark, 'center')
  drawText(
    page,
    bold,
    `Class: ${report.class.name}${report.session ? `  |  Session: ${report.session.name}` : '  |  All Sessions'}`,
    PAGE_W / 2,
    headerY - 56,
    9,
  )
  page.drawLine({
    start: { x: MARGIN, y: headerY - 72 },
    end: { x: PAGE_W - MARGIN, y: headerY - 72 },
    thickness: 2,
    color: blue,
  })
  y = headerY - 92

  const colWidths = [0.08, 0.22, 0.4, 0.3]
  const colLabels = ['Pos.', 'Admission No.', 'Student Name', 'Average (%)']
  const colX: number[] = []
  let x = MARGIN
  for (const w of colWidths) {
    colX.push(x)
    x += w * TABLE_W
  }
  const right = x

  const rowHeight = 22
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeight,
    width: TABLE_W,
    height: rowHeight,
    color: light,
  })
  colLabels.forEach((label, i) => {
    const align: 'left' | 'center' = i === 2 ? 'left' : 'center'
    const cx = colX[i] + (align === 'center' ? colWidths[i] * TABLE_W / 2 : 4)
    drawText(page, bold, label, cx, y - 15, 9, dark, align === 'center' ? 'center' : 'left')
  })
  y -= rowHeight

  if (report.students.length === 0) {
    drawText(page, font, 'No results recorded for this class yet.', MARGIN, y - 12, 10, muted)
    y -= 24
  }

  for (const entry of report.students) {
    if (y - rowHeight < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - MARGIN
      page.drawRectangle({
        x: MARGIN,
        y: y - rowHeight,
        width: TABLE_W,
        height: rowHeight,
        color: light,
      })
      colLabels.forEach((label, i) => {
        const align: 'left' | 'center' = i === 2 ? 'left' : 'center'
        const cx = colX[i] + (align === 'center' ? colWidths[i] * TABLE_W / 2 : 4)
        drawText(page, bold, label, cx, y - 15, 9, dark, align === 'center' ? 'center' : 'left')
      })
      y -= rowHeight
    }
    const name = `${entry.student.firstName} ${entry.student.middleName ? entry.student.middleName + ' ' : ''}${entry.student.lastName}`
    const values = [
      ordinal(entry.position),
      entry.student.admissionNumber,
      truncate(name, font, 9, colWidths[2] * TABLE_W - 8),
      entry.average.toFixed(2),
    ]
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: border })
    values.forEach((value, i) => {
      const align: 'left' | 'center' = i === 2 ? 'left' : 'center'
      const cx = colX[i] + (align === 'center' ? colWidths[i] * TABLE_W / 2 : 4)
      drawText(page, font, value, cx, y - 15, 9, dark, align === 'center' ? 'center' : 'left')
    })
    y -= rowHeight
  }

  if (report.students.length > 0) {
    drawText(page, font, `Total students ranked: ${report.students.length}`, right, y - 8, 9, muted, 'right')
    y -= 26
  }

  if (y < MARGIN + 90) {
    page = doc.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN - 20
  }

  drawText(page, font, "Principal's Signature", PAGE_W - MARGIN - 160, y, 10, muted)
  page.drawLine({
    start: { x: PAGE_W - MARGIN - 160, y: y - 2 },
    end: { x: PAGE_W - MARGIN, y: y - 2 },
    thickness: 1,
    color: border,
  })

  const pageCount = doc.getPageCount()
  for (let i = 0; i < pageCount; i++) {
    const p = doc.getPage(i)
    const footer = `Generated electronically by Brilliants Academy Transcript Management System - Page ${i + 1} of ${pageCount}`
    drawText(p, font, footer, PAGE_W / 2, MARGIN - 24, 8, muted, 'center')
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
