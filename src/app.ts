import express from "express";
import cors from "cors";
import { env } from "./config/env";

import { authRoutes } from "./routes/authRoutes";
import { tournamentRoutes } from "./routes/tournamentRoutes";
import { userRoutes } from "./routes/userRoutes";
import { matchRoutes } from "./routes/matchRoutes";
import { adminRoutes } from "./routes/adminRoutes";

import * as Sentry from "@sentry/node";

export const buildApp = () => {
  const app = express();

  Sentry.init({
    dsn: env.SENTRY_DSN ?? "",
    enabled: Boolean(env.SENTRY_DSN),
    enableLogs: true,
    sendDefaultPii: true,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    integrations: [Sentry.expressIntegration()],
  });

  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  
  app.get("/debug-sentry", function mainHandler(req, res) {
    Sentry.logger.info('User triggered test error', { action: 'test_error_endpoint' });
    Sentry.metrics.count('test_counter', 1);
    throw new Error("My first Sentry error!");
  });

  app.use("/auth", authRoutes);
  app.use("/tournaments", tournamentRoutes);
  app.use("/users", userRoutes);
  app.use("/matches", matchRoutes);
  app.use("/admin", adminRoutes);

  Sentry.setupExpressErrorHandler(app);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Unexpected server error" });
  });

  return { app, port: env.PORT };
};

