"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadExcel = exports.uploadPhoto = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
const uploadsDir = node_path_1.default.join(__dirname, '../../../uploads');
if (!node_fs_1.default.existsSync(uploadsDir)) {
    node_fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = node_path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
exports.uploadPhoto = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            return cb(null, true);
        cb(new response_1.AppError('Only image files are allowed'));
    },
});
exports.uploadExcel = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /\.(xlsx|xls|csv)$/i;
        if (allowed.test(file.originalname))
            return cb(null, true);
        cb(new response_1.AppError('Only .xlsx, .xls or .csv files are allowed'));
    },
});
