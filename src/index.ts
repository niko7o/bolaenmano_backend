import { buildApp } from "./app";

const { app, port } = buildApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`⚡ Tournament backend ready on http://0.0.0.0:${port}`);
});

