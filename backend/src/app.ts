import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware.js";
import apiRouter from "./routes/index.js";

const app = express();
//TODO:CORS, and CookieParser

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", apiRouter);
app.use(errorMiddleware);

export default app;
