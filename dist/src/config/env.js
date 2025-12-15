"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    GOOGLE_CLIENT_ID: zod_1.z.string().min(1),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().min(1),
    GOOGLE_IOS_CLIENT_ID: zod_1.z.string(), // iOS OAuth Client ID
    JWT_SECRET: zod_1.z.string().min(10),
    ADMIN_USERS: zod_1.z.string().default(""),
    SENTRY_DSN: zod_1.z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: zod_1.z.coerce.number().min(0).max(1).default(0),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map