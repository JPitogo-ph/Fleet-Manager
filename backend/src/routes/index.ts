import { Router } from "express";
import { vehicleRouter } from "../modules/vehicle/vehicle.router.js";
import { driverRouter } from "../modules/driver/driver.router.js";
import { tripRouter } from "../modules/trip/trip.router.js";

const apiRouter = Router();

apiRouter.use("/vehicles", vehicleRouter);
apiRouter.use("/drivers", driverRouter);
apiRouter.use("/trips", tripRouter);

export default apiRouter;
