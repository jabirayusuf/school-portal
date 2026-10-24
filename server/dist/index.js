"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const prisma_1 = __importDefault(require("./prisma"));
async function start() {
    try {
        await prisma_1.default.$connect();
        app_1.default.listen(config_1.config.port, () => {
            console.log(`BATMS server running on http://localhost:${config_1.config.port}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
void start();
