"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("./prisma"));
async function main() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const existing = await prisma_1.default.user.findUnique({ where: { username: adminUsername } });
    const hash = await bcryptjs_1.default.hash(adminPassword, 10);
    if (existing) {
        await prisma_1.default.user.update({
            where: { id: existing.id },
            data: {
                password: hash,
                role: 'ADMIN',
                mustChangePassword: false,
            },
        });
        console.log('Admin user updated successfully:');
    }
    else {
        await prisma_1.default.user.create({
            data: {
                username: adminUsername,
                password: hash,
                role: 'ADMIN',
                mustChangePassword: false,
            },
        });
        console.log('Default admin created:');
    }
    console.log(`  username: ${adminUsername}`);
    console.log(`  password: ${adminPassword}`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => prisma_1.default.$disconnect());
