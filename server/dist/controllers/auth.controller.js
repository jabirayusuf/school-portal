"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = handleLogin;
exports.handleLogout = handleLogout;
exports.handleMe = handleMe;
exports.handleChangePassword = handleChangePassword;
const auth_validator_1 = require("../validators/auth.validator");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const config_1 = require("../config");
async function handleLogin(req, res) {
    const body = auth_validator_1.loginSchema.parse(req.body);
    const { token, user } = await (0, auth_service_1.login)(body.username, body.password);
    res.cookie(config_1.config.cookieName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    (0, response_1.ok)(res, 'Logged in successfully', user);
}
async function handleLogout(_req, res) {
    res.clearCookie(config_1.config.cookieName, { path: '/' });
    (0, response_1.ok)(res, 'Logged out successfully', null);
}
async function handleMe(req, res) {
    if (!req.user) {
        throw new response_1.AppError('Not authenticated', 401);
    }
    const user = await (0, auth_service_1.getMe)(req.user);
    (0, response_1.ok)(res, 'Current user', user);
}
async function handleChangePassword(req, res) {
    const body = auth_validator_1.changePasswordSchema.parse(req.body);
    await (0, auth_service_1.changePassword)(req.user.id, body.currentPassword, body.newPassword);
    (0, response_1.ok)(res, 'Password changed successfully', null);
}
