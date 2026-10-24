"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultSchema = void 0;
const zod_1 = require("zod");
exports.resultSchema = zod_1.z.object({
    studentId: zod_1.z.coerce.number().int().positive('A student is required'),
    subjectId: zod_1.z.coerce.number().int().positive('A subject is required'),
    sessionId: zod_1.z.coerce.number().int().positive('A session is required'),
    termId: zod_1.z.coerce.number().int().positive('A term is required'),
    ca: zod_1.z.coerce.number().min(0, 'CA must be between 0 and 40').max(40, 'CA must be between 0 and 40'),
    exam: zod_1.z.coerce.number().min(0, 'Exam must be between 0 and 60').max(60, 'Exam must be between 0 and 60'),
});
