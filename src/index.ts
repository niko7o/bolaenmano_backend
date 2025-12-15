import { buildApp } from "./app";
import { startReminderScheduler } from "./services/notificationService";

const { app, port } = buildApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`🎱 Bola en Mano backend - API is running on http://0.0.0.0:${port}`);
  startReminderScheduler();
});

