"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classSchema = exports.subjectSchema = exports.termSchema = exports.sessionSchema = void 0;
const zod_1 = require("zod");
exports.sessionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Session name is required').max(50),
    isCurrent: zod_1.z.boolean().optional().default(false),
});
exports.termSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Term name is required').max(50),
    sessionId: zod_1.z.coerce.number().int().positive('A session is required'),
});
exports.subjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Subject name is required').max(100),
    code: zod_1.z.string().min(1, 'Subject code is required').max(20),
});
exports.classSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Class name is required').max(50),
});
