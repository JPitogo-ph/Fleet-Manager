import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();
//TODO:CORS, and CookieParser

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Hello from root");
});

export default app;
