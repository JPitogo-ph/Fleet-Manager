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

//Quick hack to put /me into BFF because it needs to be underneath requireAuth.
app.get("/auth/me", async (req, res) => {
  const tokens = req.session.tokens;
  if (!tokens) return res.status(401).json({ error: "Not Authenticated" });

  const payload = JSON.parse(
    Buffer.from(tokens.accessToken.split(".")[1]!, "base64url").toString(), //The above guard should guarantee this.
  );

  res.json({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    roles: payload.realm_access?.roles ?? [], //TODO: Make sure roles are in real_access instead of resource_access.
  });
});

app.use("/api", proxyRouter);
