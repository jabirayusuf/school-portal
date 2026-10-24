# BATMS — Phase Progress

Status of the 10 development phases from AGENTS.md. A phase is done only when it
runs, has no TS/ESLint/build errors, and core functionality is verified.

## Phase 1 — Project Initialization — DONE
- React 19 + Vite + TypeScript frontend with React Router, Tailwind CSS v4.
- Express 5 backend, Prisma 6 + SQLite, dotenv.
- ESLint + Prettier configured for both client and server.
- Folder structure `client/ server/ prisma/ docs/ uploads/`.
- Env configuration (`server/.env.example`) and `/api` dev proxy (5173 -> 4000).
- Verified: `npm run dev` boots both servers.

## Phase 2 — Database & Authentication — DONE
- Prisma schema: User, Student, Class, Session, Term, Subject, Result.
- Initial migration applied; default admin seeded (`admin` / `admin123`).
- JWT in HttpOnly cookie; bcrypt password hashing; login/logout/me.
- Role middleware (`authenticate`, `requireAdmin`, `requireStudent`).
- Student first-login forced password change (backend flag + frontend redirect).
- Verified via API: login, me, logout, 401 handling.

## Phase 3 — Academic Setup — DONE
- CRUD for Classes, Subjects, Sessions (with set-current), Terms.
- Zod validators; duplicate prevention (P2002 handled); admin-only routes.
- Verified via API smoke test.

## Phase 4 — Student Management — DONE
- Student CRUD with search, pagination, filters.
- Profile photo upload (multer, 2MB limit, static `/uploads`).
- Auto-creates a Student login account (username + default password = admission
  number, `mustChangePassword = true`).
- Student detail page with results summary.

## Phase 5 — Result Management — DONE
- Manual result entry/edit/delete.
- Automatic total + grade calculation (`utils/grade.ts`).
- Duplicate prevention on (student, session, term, subject).
- Students can only list their own results (scoped in controller).

## Phase 6 — Excel Import — DONE
- `POST /api/results/upload` parses first sheet via SheetJS.
- Row-level validation (admission/session/term/subject required, CA 0–40,
  Exam 0–60), unknown refs, and duplicate detection.
- Returns import summary `{ total, imported, skipped, errors: [{row, message}] }`.
- Temp file cleanup; 10MB upload limit.

## Phase 7 — Transcript Module — DONE
- `GET /api/transcript/:studentId` groups results by session -> term with
  averages and overall average.
- `GET /api/transcript/:studentId/pdf` generates a multi-page PDF via pdf-lib
  (school header, student info/photo, tables, summary, signature + stamp slots).
- Students can only access their own transcript (403 otherwise).
- Frontend transcript viewer with print styles and download button.
- Average and Position added: every session and the overall summary show the
  student's position (rank within their class); shown in the viewer and PDF.
- Class Report (admin): `GET /api/transcript/class/:classId?sessionId=` lists
  every student in a class with total results, average and position, with a
  printable page and downloadable PDF; also available from the side menu.

## Phase 8 — Dashboards — DONE
- Admin dashboard stats endpoint (`/api/admin/stats`): counts, current session,
  recent students, recent results.
- Student stats endpoint (`/api/student/stats`): overall average, latest
  session, recent results.
- Dashboard pages wired to TanStack Query with loading/empty/error states.

## Phase 9 — Polish & UX — MOSTLY DONE
- Loading spinners, skeletons, empty/error states, toast notifications,
  confirm dialogs, responsive layout (mobile drawer).
- Remaining: full accessibility pass, optional dark mode, performance
  code-splitting of the ~528 kB bundle.

## Phase 10 — Testing & Deployment — PENDING
- Unit tests for utilities/validators and API tests not yet written.
- Deployment + backup/restore docs to be added.

## Definition of Done — status
- Runs: verified (server boot + full API smoke test; client builds).
- No TS / ESLint / build errors: verified (`npm run lint`, `npm run typecheck`,
  `npm run build` both apps).
- Manually tested: API-level smoke test covers auth, CRUD, transcript, PDF,
  role protection. Browser E2E pending.
- Git commits per phase: **blocked** — `git` is not installed on this machine.

## Known notes
- `npm warn allow-scripts` appears during installs (npm 11 script-blocking).
  `prisma` / `@prisma/client` / `tsx` work regardless; run
  `npm approve-scripts` if engines fail to load postinstall.
- Bundle-size warning (>500 kB) on the client; code-splitting is a Phase 9 item.
