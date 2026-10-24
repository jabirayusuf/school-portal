"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.ok = ok;
exports.fail = fail;
function ok(res, message, data, status = 200) {
    res.status(status).json({ success: true, message, data });
}
function fail(res, message, status = 400) {
    res.status(status).json({ success: false, message, data: null });
}
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
