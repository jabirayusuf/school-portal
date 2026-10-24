"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAdminStats = handleAdminStats;
exports.handleStudentStats = handleStudentStats;
exports.handleStudentRecentResults = handleStudentRecentResults;
const stats_service_1 = require("../services/stats.service");
const result_service_1 = require("../services/result.service");
const response_1 = require("../utils/response");
async function handleAdminStats(_req, res) {
    (0, response_1.ok)(res, 'Dashboard stats', await (0, stats_service_1.adminStats)());
}
async function handleStudentStats(req, res) {
    (0, response_1.ok)(res, 'Student stats', await (0, stats_service_1.studentStats)(req.user.id));
}
async function handleStudentRecentResults(req, res) {
    const data = await (0, result_service_1.listResults)({ page: 1, pageSize: 6, onlyMine: req.user.studentId ?? undefined });
    (0, response_1.ok)(res, 'Recent results', data.items);
}
