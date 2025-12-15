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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const authRoutes_1 = require("./routes/authRoutes");
const tournamentRoutes_1 = require("./routes/tournamentRoutes");
const userRoutes_1 = require("./routes/userRoutes");
const matchRoutes_1 = require("./routes/matchRoutes");
const adminRoutes_1 = require("./routes/adminRoutes");
const Sentry = __importStar(require("@sentry/node"));
const buildApp = () => {
    const app = (0, express_1.default)();
    Sentry.init({
        dsn: env_1.env.SENTRY_DSN ?? "",
        enabled: Boolean(env_1.env.SENTRY_DSN),
        enableLogs: true,
        sendDefaultPii: true,
        tracesSampleRate: env_1.env.SENTRY_TRACES_SAMPLE_RATE,
        integrations: [Sentry.expressIntegration()],
    });
    app.use((0, cors_1.default)({
        origin: "*",
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
    app.get("/debug-sentry", function mainHandler(req, res) {
        Sentry.logger.info('User triggered test error', { action: 'test_error_endpoint' });
        Sentry.metrics.count('test_counter', 1);
        throw new Error("My first Sentry error!");
    });
    app.use("/auth", authRoutes_1.authRoutes);
    app.use("/tournaments", tournamentRoutes_1.tournamentRoutes);
    app.use("/users", userRoutes_1.userRoutes);
    app.use("/matches", matchRoutes_1.matchRoutes);
    app.use("/admin", adminRoutes_1.adminRoutes);
    Sentry.setupExpressErrorHandler(app);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ message: "Unexpected server error" });
    });
    return { app, port: env_1.env.PORT };
};
exports.buildApp = buildApp;
//# sourceMappingURL=app.js.map