"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListStudents = handleListStudents;
exports.handleGetStudent = handleGetStudent;
exports.handleCreateStudent = handleCreateStudent;
exports.handleUpdateStudent = handleUpdateStudent;
exports.handleDeleteStudent = handleDeleteStudent;
exports.handleUploadPhoto = handleUploadPhoto;
const student_validator_1 = require("../validators/student.validator");
const student_service_1 = require("../services/student.service");
const response_1 = require("../utils/response");
async function handleListStudents(req, res) {
    const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        classId: req.query.classId ? Number(req.query.classId) : undefined,
        gender: typeof req.query.gender === 'string' ? req.query.gender : undefined,
    };
    const data = await (0, student_service_1.listStudents)(query);
    (0, response_1.ok)(res, 'Students retrieved', data);
}
async function handleGetStudent(req, res) {
    const student = await (0, student_service_1.getStudent)(Number(req.params.id));
    (0, response_1.ok)(res, 'Student retrieved', student);
}
async function handleCreateStudent(req, res) {
    const body = student_validator_1.studentSchema.parse(req.body);
    const student = await (0, student_service_1.createStudent)(body);
    (0, response_1.ok)(res, 'Student created successfully', student, 201);
}
async function handleUpdateStudent(req, res) {
    const body = student_validator_1.studentSchema.parse(req.body);
    const student = await (0, student_service_1.updateStudent)(Number(req.params.id), body);
    (0, response_1.ok)(res, 'Student updated successfully', student);
}
async function handleDeleteStudent(req, res) {
    await (0, student_service_1.deleteStudent)(Number(req.params.id));
    (0, response_1.ok)(res, 'Student deleted successfully', null);
}
async function handleUploadPhoto(req, res) {
    if (!req.file) {
        (0, response_1.ok)(res, 'No file uploaded', null, 400);
        return;
    }
    const student = await (0, student_service_1.uploadStudentPhoto)(Number(req.params.id), req.file);
    (0, response_1.ok)(res, 'Photo uploaded successfully', student);
}
