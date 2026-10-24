"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListUsers = handleListUsers;
exports.handleResetUserPassword = handleResetUserPassword;
exports.handleDeleteUser = handleDeleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
async function handleListUsers(_req, res) {
    const users = await prisma_1.default.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { student: true },
    });
    const safe = users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        mustChangePassword: u.mustChangePassword,
        studentId: u.studentId,
        student: u.student,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
    }));
    (0, response_1.ok)(res, 'Users retrieved', safe);
}
async function handleResetUserPassword(req, res) {
    const userId = Number(req.params.id);
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new response_1.AppError('User not found', 404);
    let defaultPassword = user.username;
    if (user.role === 'STUDENT') {
        const student = await prisma_1.default.student.findUnique({ where: { id: user.studentId ?? 0 } });
        if (student)
            defaultPassword = student.admissionNumber;
    }
    const hash = await bcryptjs_1.default.hash(defaultPassword, 10);
    await prisma_1.default.user.update({
        where: { id: userId },
        data: { password: hash, mustChangePassword: user.role === 'STUDENT' },
    });
    (0, response_1.ok)(res, 'Password reset successfully', null);
}
async function handleDeleteUser(req, res) {
    const userId = Number(req.params.id);
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new response_1.AppError('User not found', 404);
    if (user.role === 'ADMIN')
        throw new response_1.AppError('Cannot delete an admin account', 400);
    await prisma_1.default.user.delete({ where: { id: userId } });
    (0, response_1.ok)(res, 'User deleted successfully', null);
}
