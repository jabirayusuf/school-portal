"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscriptData = getTranscriptData;
exports.getClassReport = getClassReport;
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
function computeStats(results) {
    const stats = new Map();
    for (const r of results) {
        const cur = stats.get(r.studentId) ?? { average: 0, count: 0 };
        cur.average += r.total;
        cur.count += 1;
        stats.set(r.studentId, cur);
    }
    for (const [, s] of stats) {
        s.average = s.average / s.count;
    }
    return stats;
}
function rankStudents(stats) {
    const sorted = [...stats.entries()].sort((a, b) => b[1].average - a[1].average);
    const positions = new Map();
    let prevAverage = null;
    let prevPosition = 0;
    sorted.forEach(([sid, s], i) => {
        if (prevAverage === null || s.average < prevAverage) {
            prevPosition = i + 1;
            prevAverage = s.average;
        }
        positions.set(sid, prevPosition);
    });
    return positions;
}
async function getSessionPositions(classId, sessionId) {
    const results = await prisma_1.default.result.findMany({
        where: { sessionId, student: { classId } },
        select: { studentId: true, total: true },
    });
    return rankStudents(computeStats(results));
}
async function getOverallPositions(classId) {
    const results = await prisma_1.default.result.findMany({
        where: { student: { classId } },
        select: { studentId: true, total: true },
    });
    return rankStudents(computeStats(results));
}
async function getTranscriptData(studentId) {
    const student = await prisma_1.default.student.findUnique({
        where: { id: studentId },
        include: { klass: true },
    });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    const results = await prisma_1.default.result.findMany({
        where: { studentId },
        include: { subject: true, session: true, term: true },
        orderBy: [{ session: { createdAt: 'asc' } }, { termId: 'asc' }, { subject: { name: 'asc' } }],
    });
    const classId = student.classId;
    const sessionIds = [...new Set(results.map((r) => r.sessionId))];
    const sessionPositions = new Map();
    for (const sid of sessionIds) {
        sessionPositions.set(sid, await getSessionPositions(classId, sid));
    }
    const overallPositions = await getOverallPositions(classId);
    const sessionsMap = new Map();
    for (const r of results) {
        const row = {
            subject: r.subject.name,
            code: r.subject.code,
            ca: r.ca,
            exam: r.exam,
            total: r.total,
            grade: r.grade,
            remark: r.remark,
        };
        if (!sessionsMap.has(r.sessionId)) {
            sessionsMap.set(r.sessionId, {
                sessionId: r.sessionId,
                sessionName: r.session.name,
                terms: new Map(),
            });
        }
        const session = sessionsMap.get(r.sessionId);
        const term = session.terms.get(r.termId);
        if (term) {
            term.results.push(row);
        }
        else {
            session.terms.set(r.termId, {
                termId: r.termId,
                termName: r.term.name,
                average: 0,
                results: [row],
            });
        }
    }
    const sessions = Array.from(sessionsMap.values())
        .sort((a, b) => a.sessionId - b.sessionId)
        .map((s) => {
        const terms = Array.from(s.terms.values())
            .sort((a, b) => a.termId - b.termId)
            .map((t) => ({
            ...t,
            average: t.results.length > 0
                ? t.results.reduce((sum, res) => sum + res.total, 0) / t.results.length
                : 0,
        }));
        const allTotals = terms.flatMap((t) => t.results.map((res) => res.total));
        const average = allTotals.length > 0 ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;
        return {
            sessionId: s.sessionId,
            sessionName: s.sessionName,
            average,
            position: sessionPositions.get(s.sessionId)?.get(student.id) ?? null,
            terms,
        };
    });
    const allTotals = sessions.flatMap((s) => s.terms.flatMap((t) => t.results.map((r) => r.total)));
    const overallAverage = allTotals.length > 0 ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;
    return {
        student: {
            id: student.id,
            admissionNumber: student.admissionNumber,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            gender: student.gender,
            klass: student.klass ? { id: student.klass.id, name: student.klass.name } : null,
            graduationYear: student.graduationYear,
        },
        sessions,
        overallAverage,
        overallPosition: overallPositions.get(student.id) ?? null,
        totalResults: results.length,
    };
}
async function getClassReport(classId, sessionId) {
    const klass = await prisma_1.default.class.findUnique({ where: { id: classId } });
    if (!klass)
        throw new response_1.AppError('Class not found', 404);
    let session = null;
    if (sessionId) {
        const found = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
        if (!found)
            throw new response_1.AppError('Session not found', 404);
        session = { id: found.id, name: found.name };
    }
    const where = {
        student: { classId },
        ...(session ? { sessionId: session.id } : {}),
    };
    const [results, students] = await Promise.all([
        prisma_1.default.result.findMany({ where, select: { studentId: true, total: true } }),
        prisma_1.default.student.findMany({
            where: { classId },
            select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                middleName: true,
                lastName: true,
            },
        }),
    ]);
    const stats = computeStats(results);
    const positions = rankStudents(stats);
    const reportStudents = students
        .filter((s) => stats.has(s.id))
        .map((s) => ({
        student: s,
        totalResults: stats.get(s.id).count,
        average: stats.get(s.id).average,
        position: positions.get(s.id),
    }))
        .sort((a, b) => a.position - b.position || a.student.firstName.localeCompare(b.student.firstName));
    return {
        class: { id: klass.id, name: klass.name },
        session,
        students: reportStudents,
    };
}
