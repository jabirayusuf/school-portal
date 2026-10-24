"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStats = adminStats;
exports.studentStats = studentStats;
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
async function adminStats() {
    const [studentCount, subjectCount, sessionCount, resultCount, classCount] = await Promise.all([
        prisma_1.default.student.count(),
        prisma_1.default.subject.count(),
        prisma_1.default.session.count(),
        prisma_1.default.result.count(),
        prisma_1.default.class.count(),
    ]);
    const [currentSession, recentStudents, recentResults] = await Promise.all([
        prisma_1.default.session.findFirst({ where: { isCurrent: true } }),
        prisma_1.default.student.findMany({ include: { klass: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma_1.default.result.findMany({
            include: { student: true, subject: true, session: true, term: true },
            orderBy: { createdAt: 'desc' },
            take: 6,
        }),
    ]);
    return {
        studentCount,
        subjectCount,
        sessionCount,
        resultCount,
        classCount,
        currentSession,
        recentStudents,
        recentResults,
    };
}
async function studentStats(userId) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user || !user.studentId)
        throw new response_1.AppError('Student account not linked', 400);
    const student = await prisma_1.default.student.findUnique({
        where: { id: user.studentId },
        include: { klass: true },
    });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    const results = await prisma_1.default.result.findMany({
        where: { studentId: user.studentId },
        include: { subject: true, session: true, term: true },
        orderBy: { createdAt: 'desc' },
    });
    const totalResults = results.length;
    const overallAverage = totalResults > 0
        ? results.reduce((sum, r) => sum + r.total, 0) / totalResults
        : null;
    const latestSession = results[0]?.session?.name ?? null;
    return {
        overallAverage,
        latestSession,
        totalResults,
        student,
        recentResults: results.slice(0, 6),
    };
}
