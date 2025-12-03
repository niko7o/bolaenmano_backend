import { buildApp } from "./app";

const { app, port } = buildApp();

app.listen(port, () => {
  console.log(`⚡ Tournament backend ready on http://localhost:${port}`);
});

