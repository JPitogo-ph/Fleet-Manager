import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error.types.js";
import { ZodError, z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Failed",
      details: z.treeifyError(err),
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002")
      return res.status(409).json({
        status: "fail",
        message: `Entity already exists, confict on unique field`, //TODO: No err.meta.target available, maybe find other way (user-friendly) way to show this error.
      });
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
}
