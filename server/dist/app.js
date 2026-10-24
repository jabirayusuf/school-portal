"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("./config");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const academic_routes_1 = __importDefault(require("./routes/academic.routes"));
const result_routes_1 = __importDefault(require("./routes/result.routes"));
const transcript_routes_1 = __importDefault(require("./routes/transcript.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const portal_routes_1 = __importDefault(require("./routes/portal.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const error_1 = require("./middlewares/error");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: config_1.config.clientUrl,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, cookie_parser_1.default)());
app.use('/uploads', express_1.default.static(node_path_1.default.join(__dirname, '../../uploads')));
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'BATMS API is healthy', data: { status: 'ok' } });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api', academic_routes_1.default);
app.use('/api/results', result_routes_1.default);
app.use('/api/transcript', transcript_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/student', portal_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use(error_1.notFound);
app.use(error_1.errorHandler);
exports.default = app;
