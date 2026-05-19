import type { Request, Response, NextFunction } from "express";
import { refreshAccessToken } from "../lib/keycloak.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const tokens = req.session.tokens;

  //No session
  if (!tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  //Token expired or about to expire
  if (Date.now() >= tokens.expiresAt - 30000) {
    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      req.session.tokens = refreshed;
    } catch {
      //Refresh token expired
      req.session.destroy(() => {}); //Empty callback to return 401 immediately instead of next()
      return res.status(401).json({ error: "Session expired" });
    }
  }

  next();
}
