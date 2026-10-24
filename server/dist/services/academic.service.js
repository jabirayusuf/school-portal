"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listClasses = listClasses;
exports.createClass = createClass;
exports.updateClass = updateClass;
exports.deleteClass = deleteClass;
exports.listSubjects = listSubjects;
exports.createSubject = createSubject;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
exports.listSessions = listSessions;
exports.createSession = createSession;
exports.updateSession = updateSession;
exports.setCurrentSession = setCurrentSession;
exports.deleteSession = deleteSession;
exports.listTerms = listTerms;
exports.createTerm = createTerm;
exports.updateTerm = updateTerm;
exports.deleteTerm = deleteTerm;
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
async function listClasses() {
    return prisma_1.default.class.findMany({ orderBy: { name: 'asc' } });
}
async function createClass(name) {
    const existing = await prisma_1.default.class.findUnique({ where: { name } });
    if (existing)
        throw new response_1.AppError('Class already exists', 409);
    return prisma_1.default.class.create({ data: { name } });
}
async function updateClass(id, name) {
    await prisma_1.default.class.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Class not found', 404);
    });
    return prisma_1.default.class.update({ where: { id }, data: { name } });
}
async function deleteClass(id) {
    const klass = await prisma_1.default.class.findUnique({
        where: { id },
        include: { _count: { select: { students: true } } },
    });
    if (!klass)
        throw new response_1.AppError('Class not found', 404);
    if (klass._count.students > 0) {
        throw new response_1.AppError('Cannot delete a class that has students assigned', 409);
    }
    await prisma_1.default.class.delete({ where: { id } });
}
async function listSubjects() {
    return prisma_1.default.subject.findMany({ orderBy: { name: 'asc' } });
}
async function createSubject(name, code) {
    const existing = await prisma_1.default.subject.findFirst({
        where: { OR: [{ name }, { code }] },
    });
    if (existing)
        throw new response_1.AppError('Subject name or code already exists', 409);
    return prisma_1.default.subject.create({ data: { name, code } });
}
async function updateSubject(id, name, code) {
    await prisma_1.default.subject.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Subject not found', 404);
    });
    return prisma_1.default.subject.update({ where: { id }, data: { name, code } });
}
async function deleteSubject(id) {
    await prisma_1.default.subject.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Subject not found', 404);
    });
    await prisma_1.default.subject.delete({ where: { id } });
}
async function listSessions() {
    return prisma_1.default.session.findMany({ orderBy: { createdAt: 'asc' } });
}
async function createSession(name, isCurrent) {
    const existing = await prisma_1.default.session.findUnique({ where: { name } });
    if (existing)
        throw new response_1.AppError('Session already exists', 409);
    if (isCurrent) {
        await prisma_1.default.session.updateMany({ data: { isCurrent: false } });
    }
    return prisma_1.default.session.create({ data: { name, isCurrent } });
}
async function updateSession(id, name, isCurrent) {
    await prisma_1.default.session.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Session not found', 404);
    });
    if (isCurrent) {
        await prisma_1.default.session.updateMany({ data: { isCurrent: false } });
    }
    return prisma_1.default.session.update({ where: { id }, data: { name, isCurrent } });
}
async function setCurrentSession(id) {
    await prisma_1.default.session.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Session not found', 404);
    });
    await prisma_1.default.$transaction([
        prisma_1.default.session.updateMany({ data: { isCurrent: false } }),
        prisma_1.default.session.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    return prisma_1.default.session.findUnique({ where: { id } });
}
async function deleteSession(id) {
    await prisma_1.default.session.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Session not found', 404);
    });
    await prisma_1.default.session.delete({ where: { id } });
}
async function listTerms() {
    return prisma_1.default.term.findMany({
        include: { session: true },
        orderBy: [{ session: { createdAt: 'asc' } }, { id: 'asc' }],
    });
}
async function createTerm(name, sessionId) {
    const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
    if (!session)
        throw new response_1.AppError('Session not found', 422);
    const existing = await prisma_1.default.term.findUnique({
        where: { sessionId_name: { sessionId, name } },
    });
    if (existing)
        throw new response_1.AppError('Term already exists for this session', 409);
    return prisma_1.default.term.create({ data: { name, sessionId } });
}
async function updateTerm(id, name, sessionId) {
    const term = await prisma_1.default.term.findUnique({ where: { id } });
    if (!term)
        throw new response_1.AppError('Term not found', 404);
    const session = await prisma_1.default.session.findUnique({ where: { id: sessionId } });
    if (!session)
        throw new response_1.AppError('Session not found', 422);
    const existing = await prisma_1.default.term.findUnique({
        where: { sessionId_name: { sessionId, name } },
    });
    if (existing && existing.id !== id)
        throw new response_1.AppError('Term already exists for this session', 409);
    return prisma_1.default.term.update({ where: { id }, data: { name, sessionId } });
}
async function deleteTerm(id) {
    await prisma_1.default.term.findUniqueOrThrow({ where: { id } }).catch(() => {
        throw new response_1.AppError('Term not found', 404);
    });
    await prisma_1.default.term.delete({ where: { id } });
}
