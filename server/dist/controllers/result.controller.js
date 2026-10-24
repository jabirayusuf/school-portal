"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDownloadTemplate = handleDownloadTemplate;
exports.handleListResults = handleListResults;
exports.handleCreateResult = handleCreateResult;
exports.handleUpdateResult = handleUpdateResult;
exports.handleDeleteResult = handleDeleteResult;
exports.handleUploadResults = handleUploadResults;
const result_validator_1 = require("../validators/result.validator");
const result_service_1 = require("../services/result.service");
const excel_service_1 = require("../services/excel.service");
const template_service_1 = require("../services/template.service");
const prisma_1 = __importDefault(require("../prisma"));
const response_1 = require("../utils/response");
async function handleDownloadTemplate(_req, res) {
    const currentSession = await prisma_1.default.session.findFirst({ where: { isCurrent: true } });
    const firstTerm = await prisma_1.default.term.findFirst({ orderBy: { id: 'asc' } });
    const buffer = (0, template_service_1.buildResultsTemplate)({
        rows: 50,
        session: currentSession?.name ?? '',
        term: firstTerm?.name ?? 'First',
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="results-template.xlsx"');
    res.send(buffer);
}
async function handleListResults(req, res) {
    const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
        sessionId: req.query.sessionId ? Number(req.query.sessionId) : undefined,
        termId: req.query.termId ? Number(req.query.termId) : undefined,
        classId: req.query.classId ? Number(req.query.classId) : undefined,
        onlyMine: req.user?.role === 'STUDENT' ? req.user.studentId ?? undefined : undefined,
    };
    const data = await (0, result_service_1.listResults)(query);
    (0, response_1.ok)(res, 'Results retrieved', data);
}
async function handleCreateResult(req, res) {
    const body = result_validator_1.resultSchema.parse(req.body);
    const result = await (0, result_service_1.createResult)(body);
    (0, response_1.ok)(res, 'Result recorded successfully', result, 201);
}
async function handleUpdateResult(req, res) {
    const body = result_validator_1.resultSchema.parse(req.body);
    const result = await (0, result_service_1.updateResult)(Number(req.params.id), body);
    (0, response_1.ok)(res, 'Result updated successfully', result);
}
async function handleDeleteResult(req, res) {
    await (0, result_service_1.deleteResult)(Number(req.params.id));
    (0, response_1.ok)(res, 'Result deleted successfully', null);
}
async function handleUploadResults(req, res) {
    if (!req.file) {
        (0, response_1.ok)(res, 'No file uploaded', null, 400);
        return;
    }
    const summary = await (0, excel_service_1.importResultsFromFile)(req.file.path);
    (0, response_1.ok)(res, 'Results imported successfully', summary);
}
