import { Router } from "express";
import { vehicleRouter } from "../modules/vehicle/vehicle.router.js";
import { driverRouter } from "../modules/driver/driver.router.js";

const apiRouter = Router();

apiRouter.use("/vehicles", vehicleRouter);
apiRouter.use("/drivers", driverRouter);

export default apiRouter;
