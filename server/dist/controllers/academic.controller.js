"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListClasses = handleListClasses;
exports.handleCreateClass = handleCreateClass;
exports.handleUpdateClass = handleUpdateClass;
exports.handleDeleteClass = handleDeleteClass;
exports.handleListSubjects = handleListSubjects;
exports.handleCreateSubject = handleCreateSubject;
exports.handleUpdateSubject = handleUpdateSubject;
exports.handleDeleteSubject = handleDeleteSubject;
exports.handleListSessions = handleListSessions;
exports.handleCreateSession = handleCreateSession;
exports.handleUpdateSession = handleUpdateSession;
exports.handleSetCurrentSession = handleSetCurrentSession;
exports.handleDeleteSession = handleDeleteSession;
exports.handleListTerms = handleListTerms;
exports.handleCreateTerm = handleCreateTerm;
exports.handleUpdateTerm = handleUpdateTerm;
exports.handleDeleteTerm = handleDeleteTerm;
const academic_validator_1 = require("../validators/academic.validator");
const academic = __importStar(require("../services/academic.service"));
const response_1 = require("../utils/response");
async function handleListClasses(_req, res) {
    (0, response_1.ok)(res, 'Classes retrieved', await academic.listClasses());
}
async function handleCreateClass(req, res) {
    const body = academic_validator_1.classSchema.parse(req.body);
    (0, response_1.ok)(res, 'Class created successfully', await academic.createClass(body.name), 201);
}
async function handleUpdateClass(req, res) {
    const body = academic_validator_1.classSchema.parse(req.body);
    (0, response_1.ok)(res, 'Class updated successfully', await academic.updateClass(Number(req.params.id), body.name));
}
async function handleDeleteClass(req, res) {
    await academic.deleteClass(Number(req.params.id));
    (0, response_1.ok)(res, 'Class deleted successfully', null);
}
async function handleListSubjects(_req, res) {
    (0, response_1.ok)(res, 'Subjects retrieved', await academic.listSubjects());
}
async function handleCreateSubject(req, res) {
    const body = academic_validator_1.subjectSchema.parse(req.body);
    (0, response_1.ok)(res, 'Subject created successfully', await academic.createSubject(body.name, body.code), 201);
}
async function handleUpdateSubject(req, res) {
    const body = academic_validator_1.subjectSchema.parse(req.body);
    (0, response_1.ok)(res, 'Subject updated successfully', await academic.updateSubject(Number(req.params.id), body.name, body.code));
}
async function handleDeleteSubject(req, res) {
    await academic.deleteSubject(Number(req.params.id));
    (0, response_1.ok)(res, 'Subject deleted successfully', null);
}
async function handleListSessions(_req, res) {
    (0, response_1.ok)(res, 'Sessions retrieved', await academic.listSessions());
}
async function handleCreateSession(req, res) {
    const body = academic_validator_1.sessionSchema.parse(req.body);
    (0, response_1.ok)(res, 'Session created successfully', await academic.createSession(body.name, body.isCurrent), 201);
}
async function handleUpdateSession(req, res) {
    const body = academic_validator_1.sessionSchema.parse(req.body);
    (0, response_1.ok)(res, 'Session updated successfully', await academic.updateSession(Number(req.params.id), body.name, body.isCurrent));
}
async function handleSetCurrentSession(req, res) {
    (0, response_1.ok)(res, 'Current session updated', await academic.setCurrentSession(Number(req.params.id)));
}
async function handleDeleteSession(req, res) {
    await academic.deleteSession(Number(req.params.id));
    (0, response_1.ok)(res, 'Session deleted successfully', null);
}
async function handleListTerms(_req, res) {
    (0, response_1.ok)(res, 'Terms retrieved', await academic.listTerms());
}
async function handleCreateTerm(req, res) {
    const body = academic_validator_1.termSchema.parse(req.body);
    (0, response_1.ok)(res, 'Term created successfully', await academic.createTerm(body.name, body.sessionId), 201);
}
async function handleUpdateTerm(req, res) {
    const body = academic_validator_1.termSchema.parse(req.body);
    (0, response_1.ok)(res, 'Term updated successfully', await academic.updateTerm(Number(req.params.id), body.name, body.sessionId));
}
async function handleDeleteTerm(req, res) {
    await academic.deleteTerm(Number(req.params.id));
    (0, response_1.ok)(res, 'Term deleted successfully', null);
}
