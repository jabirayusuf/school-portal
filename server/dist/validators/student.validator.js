"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentSchema = void 0;
const zod_1 = require("zod");
exports.studentSchema = zod_1.z.object({
    admissionNumber: zod_1.z.string().min(1, 'Admission number is required').max(50),
    firstName: zod_1.z.string().min(1, 'First name is required').max(100),
    middleName: zod_1.z.string().max(100).optional().default(''),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100),
    gender: zod_1.z.enum(['MALE', 'FEMALE']),
    dateOfBirth: zod_1.z.string().optional().nullable(),
    phone: zod_1.z.string().max(30).optional().default(''),
    email: zod_1.z.string().email('Invalid email').optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional().default(''),
    classId: zod_1.z.coerce.number({ message: 'A class is required' }).int().positive(),
    graduationYear: zod_1.z.coerce.number().int().min(1990).max(2100).optional().nullable(),
});
