import { Router } from "express";
import { vehicleRouter } from "../modules/vehicle/vehicle.router.js";

const apiRouter = Router();

apiRouter.use("/vehicles", vehicleRouter);

export default apiRouter;
