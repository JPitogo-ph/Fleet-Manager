import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { driverService } from "./driver.service.js";
import { CreateDriverSchema, UpdateDriverSchema } from "./driver.types.js";
import type { DriverStatus } from "../../../generated/prisma/enums.js";

export const driverRouter = Router();

driverRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const drivers = await driverService.getAll(
        status as DriverStatus | undefined,
      );
      res.json(drivers);
    } catch (err) {
      next(err);
    }
  },
);

driverRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driver = await driverService.getById(req.params.id as string);
      res.json(driver);
    } catch (err) {
      next(err);
    }
  },
);

driverRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = CreateDriverSchema.parse(req.body);
      const driver = await driverService.create(input);
      res.status(201).json(driver);
    } catch (err) {
      next(err);
    }
  },
);

driverRouter.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = UpdateDriverSchema.parse(req.body);
      const driver = await driverService.update(req.params.id as string, input);
      res.json(driver);
    } catch (err) {
      next(err);
    }
  },
);

driverRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await driverService.remove(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
