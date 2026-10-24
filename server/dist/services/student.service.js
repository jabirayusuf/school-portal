"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStudents = listStudents;
exports.getStudent = getStudent;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.uploadStudentPhoto = uploadStudentPhoto;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_path_1 = __importDefault(require("node:path"));
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
function buildWhere(query) {
    const where = {};
    if (query.search) {
        where.OR = [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { middleName: { contains: query.search } },
            { admissionNumber: { contains: query.search } },
        ];
    }
    if (query.classId)
        where.classId = query.classId;
    if (query.gender)
        where.gender = query.gender;
    return where;
}
async function listStudents(query) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));
    const where = buildWhere(query);
    const [items, total] = await Promise.all([
        prisma_1.default.student.findMany({
            where,
            include: { klass: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.student.count({ where }),
    ]);
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getStudent(id) {
    const student = await prisma_1.default.student.findUnique({
        where: { id },
        include: { klass: true },
    });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    return student;
}
async function createStudent(input) {
    const existing = await prisma_1.default.student.findUnique({
        where: { admissionNumber: input.admissionNumber },
    });
    if (existing)
        throw new response_1.AppError('Admission number already exists', 409);
    const klass = await prisma_1.default.class.findUnique({ where: { id: input.classId } });
    if (!klass)
        throw new response_1.AppError('Selected class does not exist', 422);
    const passwordHash = await bcryptjs_1.default.hash(input.admissionNumber, 10);
    const student = await prisma_1.default.$transaction(async (tx) => {
        const created = await tx.student.create({
            data: {
                admissionNumber: input.admissionNumber,
                firstName: input.firstName,
                middleName: input.middleName || null,
                lastName: input.lastName,
                gender: input.gender,
                dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
                phone: input.phone || null,
                email: input.email || null,
                address: input.address || null,
                classId: input.classId,
                graduationYear: input.graduationYear ?? null,
            },
        });
        await tx.user.create({
            data: {
                username: created.admissionNumber,
                password: passwordHash,
                role: 'STUDENT',
                mustChangePassword: true,
                studentId: created.id,
            },
        });
        return created;
    });
    return getStudent(student.id);
}
async function updateStudent(id, input) {
    const student = await prisma_1.default.student.findUnique({ where: { id } });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    if (input.admissionNumber !== student.admissionNumber) {
        const existing = await prisma_1.default.student.findUnique({
            where: { admissionNumber: input.admissionNumber },
        });
        if (existing)
            throw new response_1.AppError('Admission number already exists', 409);
    }
    const klass = await prisma_1.default.class.findUnique({ where: { id: input.classId } });
    if (!klass)
        throw new response_1.AppError('Selected class does not exist', 422);
    const updated = await prisma_1.default.$transaction(async (tx) => {
        const s = await tx.student.update({
            where: { id },
            data: {
                admissionNumber: input.admissionNumber,
                firstName: input.firstName,
                middleName: input.middleName || null,
                lastName: input.lastName,
                gender: input.gender,
                dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
                phone: input.phone || null,
                email: input.email || null,
                address: input.address || null,
                classId: input.classId,
                graduationYear: input.graduationYear ?? null,
            },
        });
        if (input.admissionNumber !== student.admissionNumber) {
            await tx.user.updateMany({
                where: { studentId: id },
                data: { username: input.admissionNumber },
            });
        }
        return s;
    });
    return getStudent(updated.id);
}
async function deleteStudent(id) {
    const student = await prisma_1.default.student.findUnique({ where: { id } });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    await prisma_1.default.$transaction([
        prisma_1.default.user.deleteMany({ where: { studentId: id } }),
        prisma_1.default.student.delete({ where: { id } }),
    ]);
}
async function uploadStudentPhoto(id, file) {
    const student = await prisma_1.default.student.findUnique({ where: { id } });
    if (!student)
        throw new response_1.AppError('Student not found', 404);
    const photoUrl = `/uploads/${node_path_1.default.basename(file.path)}`;
    return prisma_1.default.student.update({ where: { id }, data: { passportPhoto: photoUrl } });
}
