import express from "express";
import helmet from "helmet";
import { sessionMiddleware } from "./lib/session.js";
import { authRouter } from "./routes/auth.router.js";
import { proxyRouter } from "./routes/proxy.router.js";
import { requireAuth } from "./middleware/requireAuth.js";

export const app = express();

app.use(helmet());
app.use(express.json());
app.use(sessionMiddleware);

app.use("/auth", authRouter);

app.use(requireAuth);

app.use("/api", proxyRouter);
