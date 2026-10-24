import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { calculateGrade } from '../src/utils/grade'

const prisma = new PrismaClient()

const CLASS_NAME = 'SS 3 Science'
const SESSION_NAME = '2024/2025'
const TERM_NAMES = ['First', 'Second', 'Third']
const STUDENT_COUNT = 50
const ADMISSION_PREFIX = 'BA/2026/1' // generates BA/2026/100 .. BA/2026/149
const SCORES = [
  { name: 'Mathematics', code: 'MATH' },
  { name: 'English', code: 'ENG' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Chemistry', code: 'CHEM' },
  { name: 'Biology', code: 'BIO' },
]

// Deterministic PRNG so re-runs produce identical scores
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

const FEMALE_FIRST = [
  'Amina', 'Blessing', 'Chidinma', 'Deborah', 'Esther', 'Faith', 'Gloria', 'Halima', 'Ijeoma', 'Joy',
  'Kemi', 'Linda', 'Maryam', 'Ngozi', 'Oluwaseun', 'Praise', 'Rahmat', 'Sarah', 'Tolu', 'Uche',
  'Victoria', 'Zainab', 'Adaeze', 'Funke', 'Nneka',
]
const MALE_FIRST = [
  'Abdullahi', 'Bello', 'Chukwuemeka', 'David', 'Emmanuel', 'Femi', 'Gabriel', 'Hassan', 'Ibrahim', 'Joseph',
  'Kelechi', 'Musa', 'Nnamdi', 'Obinna', 'Peter', 'Samuel', 'Tunde', 'Umar', 'Wale', 'Yakubu',
  'Abubakar', 'Daniel', 'Emeka', 'Habib', 'Michael',
]
const MIDDLE_NAMES = ['Adamu', 'Bature', 'Chukwuma', 'Garba', 'Ibrahim', 'Lawal', 'Okafor', 'Olamide', 'Sani', 'Yusuf']
const LAST_NAMES = [
  'Adeyemi', 'Abdullahi', 'Abubakar', 'Adamu', 'Adebayo', 'Akinwale', 'Aliyu', 'Amadi', 'Audu', 'Awolowo',
  'Bello', 'Chukwu', 'Danjuma', 'Eze', 'Falola', 'Garba', 'Ibrahim', 'Idris', 'Jibrin', 'Kalu',
  'Lawal', 'Madaki', 'Mohammed', 'Musa', 'Nnamdi', 'Nwosu', 'Obiora', 'Ogunleye', 'Okonkwo', 'Okafor',
  'Olatunji', 'Osei', 'Oyelaran', 'Sani', 'Shehu', 'Tanko', 'Uche', 'Umar', 'Usman', 'Yahaya',
  'Yakubu', 'Yaro', 'Zaki', 'Achebe', 'Bala', 'Dauda', 'Egbuna', 'Gadzama', 'Haliru', 'Ojo',
]

function buildName(i: number): { gender: string; firstName: string; middleName: string; lastName: string } {
  const isFemale = i % 2 === 0
  const firstName = isFemale ? FEMALE_FIRST[i / 2] : MALE_FIRST[(i - 1) / 2]
  return {
    gender: isFemale ? 'FEMALE' : 'MALE',
    firstName,
    middleName: MIDDLE_NAMES[i % MIDDLE_NAMES.length],
    lastName: LAST_NAMES[i % LAST_NAMES.length],
  }
}

async function main(): Promise<void> {
  const rng = mulberry32(2026)

  const klass =
    (await prisma.class.findUnique({ where: { name: CLASS_NAME } })) ??
    (await prisma.class.create({ data: { name: CLASS_NAME } }))

  const session =
    (await prisma.session.findUnique({ where: { name: SESSION_NAME } })) ??
    (await prisma.session.create({ data: { name: SESSION_NAME, isCurrent: true } }))
  if (!session.isCurrent) {
    await prisma.session.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } })
    await prisma.session.update({ where: { id: session.id }, data: { isCurrent: true } })
  }

  const terms = []
  for (const name of TERM_NAMES) {
    const term =
      (await prisma.term.findUnique({ where: { sessionId_name: { sessionId: session.id, name } } })) ??
      (await prisma.term.create({ data: { sessionId: session.id, name } }))
    terms.push(term)
  }

  const subjects = []
  for (const s of SCORES) {
    const existing = await prisma.subject.findFirst({ where: { OR: [{ name: s.name }, { code: s.code }] } })
    const subject = existing ?? (await prisma.subject.create({ data: { name: s.name, code: s.code } }))
    subjects.push(subject)
  }

  const existingStudents = new Map(
    (await prisma.student.findMany({ where: { classId: klass.id } })).map((s) => [s.admissionNumber, s.id]),
  )

  const students: Array<{ id: number }> = []
  const createdUsers = []
  const createdStudents = []
  let renamed = 0
  for (let i = 0; i < STUDENT_COUNT; i++) {
    const admission = `${ADMISSION_PREFIX}${pad(i, 2)}`
    const { gender, firstName, middleName, lastName } = buildName(i)
    const existingId = existingStudents.get(admission)
    if (existingId) {
      const found = await prisma.student.findUnique({ where: { id: existingId } })
      if (found && (found.firstName !== firstName || found.middleName !== middleName || found.lastName !== lastName || found.gender !== gender)) {
        await prisma.student.update({ where: { id: existingId }, data: { firstName, middleName, lastName, gender } })
        renamed += 1
      }
      students.push({ id: existingId })
      continue
    }
    const student = await prisma.student.create({
      data: {
        admissionNumber: admission,
        firstName,
        middleName,
        lastName,
        gender,
        classId: klass.id,
        graduationYear: 2026,
      },
    })
    createdStudents.push(student)
    const hash = await bcrypt.hash(admission, 10)
    createdUsers.push({ username: admission, password: hash, studentId: student.id })
    students.push(student)
  }

  if (createdStudents.length > 0) {
    await prisma.user.createMany({
      data: createdUsers.map((u) => ({
        username: u.username,
        password: u.password,
        role: 'STUDENT',
        mustChangePassword: true,
        studentId: u.studentId,
      })),
    })
  }

  const existingResults = new Set(
    (
      await prisma.result.findMany({
        where: {
          sessionId: session.id,
          termId: { in: terms.map((t) => t.id) },
          studentId: { in: students.map((s) => s.id) },
        },
        select: { studentId: true, subjectId: true, termId: true },
      })
    ).map((r) => `${r.studentId}:${r.subjectId}:${r.termId}`),
  )

  const results = []
  for (const student of students) {
    for (const subject of subjects) {
      for (const term of terms) {
        const key = `${student.id}:${subject.id}:${term.id}`
        if (existingResults.has(key)) continue
        const ca = 15 + Math.floor(rng() * 26) // 15..40
        const exam = 25 + Math.floor(rng() * 34) // 25..58
        const total = ca + exam
        const { grade, remark } = calculateGrade(total)
        results.push({ studentId: student.id, subjectId: subject.id, sessionId: session.id, termId: term.id, ca, exam, total, grade, remark })
      }
    }
  }

  if (results.length > 0) {
    await prisma.result.createMany({ data: results })
  }

  console.log(`Class: ${klass.name}`)
  console.log(`Session: ${session.name} | Terms: ${terms.map((t) => t.name).join(', ')}`)
  console.log(`Subjects: ${subjects.map((s) => s.name).join(', ')}`)
  console.log(`Students added: ${createdStudents.length} (total in class: ${students.length}; renamed: ${renamed})`)
  console.log(`Results added: ${results.length} (expected ${students.length * subjects.length * terms.length})`)
  console.log(`Student logins: username = password = admission number (must change on first login)`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
