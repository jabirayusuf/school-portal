"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
const token_1 = require("../utils/token");
function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username ?? '',
        role: user.role ?? 'STUDENT',
        mustChangePassword: user.mustChangePassword ?? false,
        studentId: user.studentId ?? null,
        student: user.student ?? null,
        createdAt: user.createdAt ?? new Date().toISOString(),
        updatedAt: user.updatedAt ?? new Date().toISOString(),
    };
}
async function login(username, password) {
    const user = await prisma_1.default.user.findUnique({
        where: { username },
        include: { student: { include: { klass: true } } },
    });
    if (!user) {
        throw new response_1.AppError('Invalid username or password', 401);
    }
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid) {
        throw new response_1.AppError('Invalid username or password', 401);
    }
    const authUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId,
    };
    const token = (0, token_1.signToken)(authUser);
    return { token, user: sanitizeUser(user) };
}
async function getMe(user) {
    const dbUser = await prisma_1.default.user.findUnique({
        where: { id: user.id },
        include: { student: { include: { klass: true } } },
    });
    if (!dbUser) {
        return sanitizeUser({
            id: user.id,
            username: user.username,
            role: user.role,
            studentId: user.studentId,
            mustChangePassword: false,
        });
    }
    return sanitizeUser(dbUser);
}
async function changePassword(userId, currentPassword, newPassword) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new response_1.AppError('User not found', 404);
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid)
        throw new response_1.AppError('Current password is incorrect', 400);
    const hash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { password: hash, mustChangePassword: false },
    });
}
