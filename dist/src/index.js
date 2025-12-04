"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const { app, port } = (0, app_1.buildApp)();
app.listen(port, () => {
    console.log(`⚡ Tournament backend ready on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map