import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { vehicleService } from "./vehicle.service.js";
import { CreateVehicleSchema, UpdateVehicleSchema } from "./vehicle.types.js";
import type { VehicleStatus } from "../../../generated/prisma/enums.js";

export const vehicleRouter = Router();

vehicleRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const vehicles = await vehicleService.getAll(
        status as VehicleStatus | undefined,
      );
      res.json(vehicles);
    } catch (err) {
      next(err);
    }
  },
);

vehicleRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vehicle = await vehicleService.getById(req.params.id as string);
      res.json(vehicle);
    } catch (err) {
      next(err);
    }
  },
);

vehicleRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateVehicleSchema.parse(req.body);
      const vehicle = await vehicleService.create(input);
      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  },
);

vehicleRouter.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = UpdateVehicleSchema.parse(req.body);
      const vehicle = await vehicleService.update(
        req.params.id as string,
        input,
      );
      res.status(200).json(vehicle);
    } catch (err) {
      next(err);
    }
  },
);

vehicleRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vehicleService.remove(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
