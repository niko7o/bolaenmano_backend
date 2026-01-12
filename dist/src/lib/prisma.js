"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const env_1 = require("../config/env");
const globalForPrisma = globalThis;
const { Pool } = pg_1.default;
// Parse DATABASE_URL to extract connection parameters
const databaseUrl = env_1.env.DATABASE_URL;
// Configure pool with proper SSL settings for Neon
const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon.tech") || databaseUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
});
// Handle pool errors
pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
});
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg(pool),
        log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "info", "warn", "error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
// Log connection info (without exposing credentials)
if (databaseUrl) {
    const urlObj = new URL(databaseUrl);
    console.log(`📦 Database: ${urlObj.hostname}${urlObj.pathname}`);
}
else {
    console.error("❌ DATABASE_URL is not set!");
}
//# sourceMappingURL=prisma.js.map