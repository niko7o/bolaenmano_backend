// Initialize Sentry BEFORE importing Express
import * as Sentry from "@sentry/node";
import { env } from "./config/env";

Sentry.init({
  dsn: env.SENTRY_DSN ?? "",
  enabled: Boolean(env.SENTRY_DSN),
  enableLogs: true,
  sendDefaultPii: true,
  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  integrations: [Sentry.expressIntegration()],
});

import { buildApp } from "./app";
import { startReminderScheduler } from "./services/notificationService";

const { app, port } = buildApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`🎱 Bola en Mano backend - API is running on http://0.0.0.0:${port}`);
  startReminderScheduler();
});

