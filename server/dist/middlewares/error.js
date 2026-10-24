"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const multer_1 = __importDefault(require("multer"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const response_1 = require("../utils/response");
function notFound(_req, res) {
    (0, response_1.fail)(res, 'Route not found', 404);
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof response_1.AppError) {
        return (0, response_1.fail)(res, err.message, err.statusCode);
    }
    if (err instanceof zod_1.ZodError) {
        const message = err.errors.map((e) => e.message).join('; ');
        return (0, response_1.fail)(res, message, 422);
    }
    if (err instanceof multer_1.default.MulterError) {
        return (0, response_1.fail)(res, `Upload error: ${err.message}`, 400);
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002')
            return (0, response_1.fail)(res, 'A record with these details already exists', 409);
        if (err.code === 'P2003')
            return (0, response_1.fail)(res, 'Record is referenced by other data', 409);
        if (err.code === 'P2025')
            return (0, response_1.fail)(res, 'Record not found', 404);
    }
    console.error(err);
    return (0, response_1.fail)(res, 'Internal server error', 500);
}
