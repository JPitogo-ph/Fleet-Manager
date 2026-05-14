import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export const proxyRouter = Router();

proxyRouter.all(
  "/*splat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = new URL(`${config.api.baseUrl}${req.path}`);

      Object.entries(req.query).forEach(([key, value]) => {
        url.searchParams.set(key, value as string);
      });

      const response = await fetch(url.href, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.session.tokens?.accessToken}`,
        },
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? JSON.stringify(req.body)
            : null,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      next(err);
    }
  },
);
