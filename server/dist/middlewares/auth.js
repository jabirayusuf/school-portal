"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireStudent = requireStudent;
const token_1 = require("../utils/token");
const response_1 = require("../utils/response");
const config_1 = require("../config");
function authenticate(req, _res, next) {
    const token = req.cookies?.[config_1.config.cookieName];
    if (!token) {
        throw new response_1.AppError('Not authenticated', 401);
    }
    try {
        req.user = (0, token_1.verifyToken)(token);
        next();
    }
    catch {
        throw new response_1.AppError('Session expired or invalid', 401);
    }
}
function requireAdmin(req, _res, next) {
    if (req.user?.role !== 'ADMIN') {
        throw new response_1.AppError('Admin access required', 403);
    }
    next();
}
function requireStudent(req, _res, next) {
    if (req.user?.role !== 'STUDENT') {
        throw new response_1.AppError('Student access required', 403);
    }
    next();
}
