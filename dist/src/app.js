"use strict";
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
const buildApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: "*",
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
    app.use("/auth", authRoutes_1.authRoutes);
    app.use("/tournaments", tournamentRoutes_1.tournamentRoutes);
    app.use("/users", userRoutes_1.userRoutes);
    app.use("/matches", matchRoutes_1.matchRoutes);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ message: "Unexpected server error" });
    });
    return { app, port: env_1.env.PORT };
};
exports.buildApp = buildApp;
//# sourceMappingURL=app.js.map