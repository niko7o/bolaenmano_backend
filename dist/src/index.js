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
// Initialize Sentry BEFORE importing Express
const Sentry = __importStar(require("@sentry/node"));
const env_1 = require("./config/env");
Sentry.init({
    dsn: env_1.env.SENTRY_DSN ?? "",
    enabled: Boolean(env_1.env.SENTRY_DSN),
    enableLogs: true,
    sendDefaultPii: true,
    tracesSampleRate: env_1.env.SENTRY_TRACES_SAMPLE_RATE,
    integrations: [Sentry.expressIntegration()],
});
const app_1 = require("./app");
const notificationService_1 = require("./services/notificationService");
const { app, port } = (0, app_1.buildApp)();
app.listen(port, "0.0.0.0", () => {
    console.log(`🎱 Bola en Mano backend - API is running on http://0.0.0.0:${port}`);
    (0, notificationService_1.startReminderScheduler)();
});
//# sourceMappingURL=index.js.map