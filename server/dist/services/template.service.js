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
exports.RESULTS_TEMPLATE_COLUMNS = void 0;
exports.buildResultsTemplate = buildResultsTemplate;
const XLSX = __importStar(require("xlsx"));
exports.RESULTS_TEMPLATE_COLUMNS = [
    'Admission Number',
    'Session',
    'Term',
    'Subject',
    'CA',
    'Exam',
];
function buildResultsTemplate(options = {}) {
    const { rows = 50, session = '', term = '' } = options;
    const rowData = Array.from({ length: rows }, (_, i) => ({
        'Admission Number': `BA${String(i + 1).padStart(3, '0')}`,
        Session: session,
        Term: term,
        Subject: '',
        CA: '',
        Exam: '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rowData, {
        header: [...exports.RESULTS_TEMPLATE_COLUMNS],
    });
    worksheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 8 }, { wch: 8 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
