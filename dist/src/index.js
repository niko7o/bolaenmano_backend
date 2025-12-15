"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const notificationService_1 = require("./services/notificationService");
const { app, port } = (0, app_1.buildApp)();
app.listen(port, "0.0.0.0", () => {
    console.log(`🎱 Bola en Mano backend - API is running on http://0.0.0.0:${port}`);
    (0, notificationService_1.startReminderScheduler)();
});
//# sourceMappingURL=index.js.map