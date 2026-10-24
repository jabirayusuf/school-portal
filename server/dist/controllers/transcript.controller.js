"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetTranscript = handleGetTranscript;
exports.handleGetTranscriptPdf = handleGetTranscriptPdf;
exports.handleGetClassReport = handleGetClassReport;
exports.handleGetClassReportPdf = handleGetClassReportPdf;
const transcript_service_1 = require("../services/transcript.service");
const pdf_service_1 = require("../services/pdf.service");
const response_1 = require("../utils/response");
async function handleGetTranscript(req, res) {
    const studentId = Number(req.params.studentId);
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
        throw new response_1.AppError('You can only view your own transcript', 403);
    }
    const transcript = await (0, transcript_service_1.getTranscriptData)(studentId);
    (0, response_1.ok)(res, 'Transcript retrieved', transcript);
}
async function handleGetTranscriptPdf(req, res) {
    const studentId = Number(req.params.studentId);
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
        throw new response_1.AppError('You can only download your own transcript', 403);
    }
    const transcript = await (0, transcript_service_1.getTranscriptData)(studentId);
    const pdf = await (0, pdf_service_1.generateTranscriptPdf)(transcript);
    const filename = `transcript-${transcript.student.admissionNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
}
async function handleGetClassReport(req, res) {
    const classId = Number(req.params.classId);
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
    const report = await (0, transcript_service_1.getClassReport)(classId, sessionId);
    (0, response_1.ok)(res, 'Class report retrieved', report);
}
async function handleGetClassReportPdf(req, res) {
    const classId = Number(req.params.classId);
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
    const report = await (0, transcript_service_1.getClassReport)(classId, sessionId);
    const pdf = await (0, pdf_service_1.generateClassReportPdf)(report);
    const sessionLabel = report.session?.name.replace(/[^\w-]+/g, '_') ?? 'All_Sessions';
    const filename = `${report.class.name.replace(/[^\w-]+/g, '_')}_${sessionLabel}_report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
}
