"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResults = listResults;
exports.getResult = getResult;
exports.createResult = createResult;
exports.updateResult = updateResult;
exports.deleteResult = deleteResult;
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
const grade_1 = require("../utils/grade");
const include = {
    student: true,
    subject: true,
    session: true,
    term: true,
};
async function listResults(query) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 15));
    const where = {};
    if (query.onlyMine) {
        where.studentId = query.onlyMine;
    }
    else {
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.classId)
            where.student = { classId: query.classId };
    }
    if (query.sessionId)
        where.sessionId = query.sessionId;
    if (query.termId)
        where.termId = query.termId;
    const [items, total] = await Promise.all([
        prisma_1.default.result.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.result.count({ where }),
    ]);
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getResult(id) {
    const result = await prisma_1.default.result.findUnique({ where: { id }, include });
    if (!result)
        throw new response_1.AppError('Result not found', 404);
    return result;
}
async function ensureReferences(input) {
    const [student, subject, session, term] = await Promise.all([
        prisma_1.default.student.findUnique({ where: { id: input.studentId } }),
        prisma_1.default.subject.findUnique({ where: { id: input.subjectId } }),
        prisma_1.default.session.findUnique({ where: { id: input.sessionId } }),
        prisma_1.default.term.findUnique({ where: { id: input.termId } }),
    ]);
    if (!student)
        throw new response_1.AppError('Student not found', 422);
    if (!subject)
        throw new response_1.AppError('Subject not found', 422);
    if (!session)
        throw new response_1.AppError('Session not found', 422);
    if (!term)
        throw new response_1.AppError('Term not found', 422);
    if (term.sessionId !== input.sessionId) {
        throw new response_1.AppError('Term does not belong to the selected session', 422);
    }
}
async function createResult(input) {
    await ensureReferences(input);
    const duplicate = await prisma_1.default.result.findUnique({
        where: {
            studentId_sessionId_termId_subjectId: {
                studentId: input.studentId,
                sessionId: input.sessionId,
                termId: input.termId,
                subjectId: input.subjectId,
            },
        },
    });
    if (duplicate)
        throw new response_1.AppError('A result already exists for this student, session, term and subject', 409);
    const total = input.ca + input.exam;
    const { grade, remark } = (0, grade_1.calculateGrade)(total);
    return prisma_1.default.result.create({
        data: { ...input, total, grade, remark },
        include,
    });
}
async function updateResult(id, input) {
    const existing = await prisma_1.default.result.findUnique({ where: { id } });
    if (!existing)
        throw new response_1.AppError('Result not found', 404);
    await ensureReferences(input);
    const duplicate = await prisma_1.default.result.findFirst({
        where: {
            studentId: input.studentId,
            sessionId: input.sessionId,
            termId: input.termId,
            subjectId: input.subjectId,
            NOT: { id },
        },
    });
    if (duplicate)
        throw new response_1.AppError('A result already exists for this student, session, term and subject', 409);
    const total = input.ca + input.exam;
    const { grade, remark } = (0, grade_1.calculateGrade)(total);
    return prisma_1.default.result.update({
        where: { id },
        data: { ...input, total, grade, remark },
        include,
    });
}
async function deleteResult(id) {
    await prisma_1.default.result.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Result not found', 404);
    });
    await prisma_1.default.result.delete({ where: { id } });
}
