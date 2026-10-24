"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importResultsFromFile = importResultsFromFile;
const node_fs_1 = __importDefault(require("node:fs"));
const XLSX = __importStar(require("xlsx"));
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
const grade_1 = require("../utils/grade");
function normalizeHeader(header) {
    return header.trim().toLowerCase().replace(/[^a-z]/g, '');
}
function parseRow(raw) {
    const row = {};
    for (const [key, value] of Object.entries(raw)) {
        const header = normalizeHeader(key);
        if (header.includes('admission'))
            row.admissionNumber = String(value ?? '').trim();
        if (header === 'session')
            row.session = String(value ?? '').trim();
        if (header === 'term')
            row.term = String(value ?? '').trim();
        if (header === 'subject')
            row.subject = String(value ?? '').trim();
        if (header === 'ca')
            row.ca = Number(value);
        if (header === 'exam')
            row.exam = Number(value);
    }
    return row;
}
async function importResultsFromFile(filePath) {
    if (!node_fs_1.default.existsSync(filePath))
        throw new response_1.AppError('Uploaded file not found', 400);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet)
        throw new response_1.AppError('The file does not contain any sheets', 400);
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const rows = rawRows.map(parseRow);
    const summary = { total: rows.length, imported: 0, skipped: 0, errors: [] };
    const errors = [];
    const valid = [];
    rows.forEach((row, index) => {
        const line = index + 2;
        if (!row.admissionNumber)
            errors.push({ row: line, message: 'Admission Number is missing' });
        else if (!row.session)
            errors.push({ row: line, message: 'Session is missing' });
        else if (!row.term)
            errors.push({ row: line, message: 'Term is missing' });
        else if (!row.subject)
            errors.push({ row: line, message: 'Subject is missing' });
        else if (row.ca === undefined || Number.isNaN(row.ca) || row.ca < 0 || row.ca > 40) {
            errors.push({ row: line, message: 'CA must be a number between 0 and 40' });
        }
        else if (row.exam === undefined || Number.isNaN(row.exam) || row.exam < 0 || row.exam > 60) {
            errors.push({ row: line, message: 'Exam must be a number between 0 and 60' });
        }
        else {
            valid.push({ ...row, ca: row.ca, exam: row.exam, originalIndex: index });
        }
    });
    const studentMap = new Map();
    const sessionMap = new Map();
    const subjectMap = new Map();
    const termMap = new Map();
    const students = await prisma_1.default.student.findMany({ select: { id: true, admissionNumber: true } });
    for (const s of students)
        studentMap.set(s.admissionNumber.toLowerCase(), s.id);
    const sessions = await prisma_1.default.session.findMany({ select: { id: true, name: true } });
    for (const s of sessions)
        sessionMap.set(s.name.toLowerCase(), s.id);
    const subjects = await prisma_1.default.subject.findMany({ select: { id: true, name: true, code: true } });
    for (const s of subjects) {
        subjectMap.set(s.name.toLowerCase(), s.id);
        subjectMap.set(s.code.toLowerCase(), s.id);
    }
    const terms = await prisma_1.default.term.findMany({ select: { id: true, name: true, sessionId: true } });
    for (const t of terms) {
        if (!termMap.has(t.name.toLowerCase()))
            termMap.set(t.name.toLowerCase(), new Map());
        termMap.get(t.name.toLowerCase()).set(String(t.sessionId), t.id);
    }
    const existingResults = new Set();
    const results = await prisma_1.default.result.findMany({
        select: { studentId: true, sessionId: true, termId: true, subjectId: true },
    });
    for (const r of results) {
        existingResults.add(`${r.studentId}:${r.sessionId}:${r.termId}:${r.subjectId}`);
    }
    const seen = new Set();
    let imported = 0;
    const createManyData = [];
    for (const row of valid) {
        const line = row.originalIndex + 2;
        const studentId = studentMap.get(row.admissionNumber.toLowerCase());
        if (!studentId) {
            errors.push({ row: line, message: `Unknown admission number "${row.admissionNumber}"` });
            continue;
        }
        const sessionId = sessionMap.get(row.session.toLowerCase());
        if (!sessionId) {
            errors.push({ row: line, message: `Unknown session "${row.session}"` });
            continue;
        }
        const subjectId = subjectMap.get(row.subject.toLowerCase());
        if (!subjectId) {
            errors.push({ row: line, message: `Unknown subject "${row.subject}"` });
            continue;
        }
        const termSessionMap = termMap.get(row.term.toLowerCase());
        const termId = termSessionMap?.get(String(sessionId));
        if (!termId) {
            errors.push({
                row: line,
                message: `Unknown term "${row.term}" for session "${row.session}"`,
            });
            continue;
        }
        const key = `${studentId}:${sessionId}:${termId}:${subjectId}`;
        if (existingResults.has(key) || seen.has(key)) {
            errors.push({
                row: line,
                message: 'Duplicate result (student, session, term, subject already exists)',
            });
            continue;
        }
        seen.add(key);
        const total = row.ca + row.exam;
        const { grade, remark } = (0, grade_1.calculateGrade)(total);
        createManyData.push({
            studentId,
            subjectId,
            sessionId,
            termId,
            ca: row.ca,
            exam: row.exam,
            total,
            grade,
            remark,
        });
        imported++;
    }
    if (createManyData.length > 0) {
        await prisma_1.default.result.createMany({ data: createManyData });
    }
    summary.imported = imported;
    summary.skipped = errors.length;
    summary.errors = errors;
    try {
        node_fs_1.default.unlinkSync(filePath);
    }
    catch {
        // ignore cleanup failure
    }
    return summary;
}
