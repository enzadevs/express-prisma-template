import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import pino from "pino";
import { db } from "../prisma/db";

import { adminUsersRouter } from "./routes/users/adminusers";

const logger = pino(
  process.env["NODE_ENV"] !== "production"
    ? { transport: { target: "pino-pretty" } }
    : undefined,
);

await db.orm.public.AdminUser.limit(1).all();
logger.info("Database connection verified");

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// mount your route modules here, e.g.:
app.use("/api/admin-users", adminUsersRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler — always last
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const port = Number(process.env["PORT"] ?? 3000);

const server = app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

const shutdown = async () => {
  logger.info("Shutting down...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
