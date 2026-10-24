# Brilliants Academy Transcript Management System (BATMS)

## Overview

BATMS digitizes student academic records for Brilliants Academy, Jos, Nigeria.
Admins manage students, sessions, terms, subjects, classes, and results
(manual or via Excel upload) and generate transcripts. Students log in with
their admission number, view results/transcripts, download PDF transcripts,
and change their password.

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS v4 + TanStack Query
- Backend: Node.js + Express 5 + Prisma ORM + SQLite
- Auth: bcrypt-hashed passwords, JWT in HttpOnly cookie (`token`)
- Excel: SheetJS (xlsx). PDF: pdf-lib

## Folder Structure

```
brilliants/
  client/      React + Vite frontend
  server/      Express backend (src/controllers, routes, services, ...)
  prisma/      Prisma schema, migrations, SQLite database (dev.db)
  docs/        Documentation
  uploads/     Uploaded photos and Excel files (gitignored)
```

## Prerequisites

- Node.js 20+ (developed on Node 24)
- npm 11+

## Setup

```bash
# 1. Install dependencies
cd client && npm install
cd ../server && npm install

# 2. Configure environment
#    server/.env (created from server/.env.example):
#    PORT=4000
#    JWT_SECRET=<long random string>
#    CLIENT_URL=http://localhost:5173
#    DATABASE_URL="file:./dev.db"

# 3. Create database and seed admin
cd server
npm run prisma:migrate   # or: npx prisma migrate deploy --schema ../prisma/schema.prisma
npm run prisma:seed      # creates admin / admin123
```

## Running

```bash
# Terminal 1 - backend (http://localhost:4000)
cd server && npm run dev

# Terminal 2 - frontend (http://localhost:5173)
cd client && npm run dev
```

Open http://localhost:5173 and log in.

### Default accounts

| Role    | Username        | Password        |
| ------- | --------------- | --------------- |
| Admin   | `admin`         | `admin123`      |
| Student | admission number (e.g. `BA001`) | admission number |

Students must change their password on first login (enforced by the app).

## Useful commands

```bash
# Server
cd server
npm run dev            # start dev server (tsx watch)
npm run build          # compile TypeScript -> dist/
npm run start          # run compiled server
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run format         # Prettier
npm run prisma:migrate # apply schema changes (dev)
npm run prisma:seed    # (re)create default admin

# Client
cd client
npm run dev            # Vite dev server
npm run build          # production build
npm run lint           # ESLint
npm run preview        # preview production build
```

## API conventions

Every endpoint returns:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use the same envelope with `success: false`. Main routes:

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/password`
- `GET|POST|PUT|DELETE /api/students`, `POST /api/students/:id/photo`
- `GET|POST|PUT|DELETE /api/classes`, `/api/subjects`, `/api/sessions`, `/api/terms`
  (plus `POST /api/sessions/:id/set-current`)
- `GET|POST|PUT|DELETE /api/results`, `POST /api/results/upload` (Excel)
- `GET /api/results/template` (downloads a 50-student `.xlsx` results template)
- `GET /api/transcript/:studentId`, `GET /api/transcript/:studentId/pdf`
  (optional `?sessionId=` and `?termId=` filters: when a session/term is given,
  only that session/term is returned/exported; the transcript page has a
  Session + Term filter bar that feeds these)
- `GET /api/transcript/class/:classId?sessionId=` and
  `GET /api/transcript/class/:classId/pdf?sessionId=` (class report with
  average + position per student, printable/PDF)
- `GET /api/admin/stats`, `GET /api/student/stats`, `GET|PUT|DELETE /api/users`

## Excel import format

First sheet, header row with these columns (case/space-insensitive):

| Admission Number | Session | Term | Subject | CA | Exam |
| ---------------- | ------- | ---- | ------- | -- | ---- |

- CA range 0–40, Exam range 0–60.
- Invalid rows are skipped and reported (row number + reason).
- Duplicate `(student, session, term, subject)` records are rejected.
- Students, sessions, terms, subjects must already exist.
- A ready-made 50-student template can be downloaded from the Upload Results
  page (or `GET /api/results/template`), and a copy lives at `docs/results-template.xlsx`.

## Grade scale

| Total   | Grade | Remark        |
| ------- | ----- | ------------- |
| 75–100  | A     | Excellent     |
| 65–74   | B     | Very Good     |
| 55–64   | C     | Good          |
| 45–54   | D     | Fair          |
| 40–44   | E     | Pass          |
| 0–39    | F     | Fail          |

## Phase progress

See `docs/phases.md` for the phase-by-phase status and Definition of Done.
