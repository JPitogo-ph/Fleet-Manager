import { Router } from "express";
import { tripService } from "./trip.service.js";
import {
  CancelTripSchema,
  CompleteTripSchema,
  CreateTripSchema,
  GetTripsSchema,
  StartTripSchema,
  type CreateTripInput,
} from "./trip.types.js";
import type { Request, Response, NextFunction } from "express";
import { stripUndefinedKeys } from "../../utils/stripUndefinedKeys.js";

export const tripRouter = Router();

tripRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = GetTripsSchema.parse(req.query);
    const trips = await tripService.getAll(stripUndefinedKeys(filters));
    res.json(trips);
  } catch (err) {
    next(err);
  }
});

tripRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trip = await tripService.getById(req.params.id as string);
      res.json(trip);
    } catch (err) {
      next(err);
    }
  },
);

tripRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateTripSchema.parse(req.body);
      const trip = await tripService.create(input);
      res.status(201).json(trip);
    } catch (err) {
      next(err);
    }
  },
);

tripRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tripService.remove(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// Business logic
tripRouter.patch(
  "/:id/start",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = StartTripSchema.parse(req.body);
      const trip = await tripService.start(req.params.id as string, input);
      res.json(trip);
    } catch (err) {
      next(err);
    }
  },
);

tripRouter.patch(
  "/:id/complete",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CompleteTripSchema.parse(req.body);
      const trip = await tripService.complete(req.params.id as string, input);
      res.json(trip);
    } catch (err) {
      next(err);
    }
  },
);

tripRouter.patch(
  "/:id/cancel",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CancelTripSchema.parse(req.body);
      const trip = await tripService.cancel(req.params.id as string, input);
      res.json(trip);
    } catch (err) {
      next(err);
    }
  },
);
