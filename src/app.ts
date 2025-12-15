import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { tournamentRoutes } from "./routes/tournamentRoutes";
import { userRoutes } from "./routes/userRoutes";
import { matchRoutes } from "./routes/matchRoutes";
import { adminRoutes } from "./routes/adminRoutes";

export const buildApp = () => {
  const app = express();

  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/auth", authRoutes);
  app.use("/tournaments", tournamentRoutes);
  app.use("/users", userRoutes);
  app.use("/matches", matchRoutes);
  app.use("/admin", adminRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Unexpected server error" });
  });

  return { app, port: env.PORT };
};

