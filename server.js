import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AuthRouter from "./routes/AuthRouter.js";
import ProjectRouter from "./taskManager/Routes/ProjectRoute.js";
import UserRoute from "./taskManager/Routes/UserRoute.js";
import TaskRoute from "./taskManager/Routes/TaskRoute.js";
import ProjectMemberRoute from "./taskManager/Routes/ProjectMemberRoute.js";
import ModuleRoute from "./taskManager/Routes/ModulesRoute.js";
import AccessRoute from "./taskManager/Routes/AccessControlRoute.js";

import CustomError from "./Utils/CustomError.js";
import runAllCronShedulers from "./taskManager/Scheduler/index.js";

import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.port || 8000;

app.use(cors());
app.use(express.json());

app.use("/", AuthRouter);
app.use("/taskManager/project", ProjectRouter);
app.use("/taskManager/user", UserRoute);
app.use("/taskManager/task", TaskRoute);
app.use("/taskManager/projectMember", ProjectMemberRoute);
app.use("/taskManager/module", ModuleRoute);
app.use("/taskManager/checkAccess", AccessRoute);
app.use("/dummy", (req, res) => {
  res.status(200).send("Dummy endpoint triggered successfully.");
});

app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Can't find ${req.originalUrl} on the server!`,
    404
  );
  next(err);
});

const uri = process.env.MONGODB_URI;
const environment = process.env.ENVIRONMENT;

mongoose.set("strictQuery", true);
mongoose
  .connect(uri, { dbName: "taskManager" })
  .then(() => {
    app.listen(port, () => {
      console.log(
        `Database is Connected and Server is Running on Port:${port}`
      );
    });
    runAllCronShedulers();
    setInterval(() => {
      axios.get(`https://personal-project-app-backend-service.onrender.com/dummy`)
      .then(response => {
        console.log('Triggered', response.data);
      })
      .catch(error => {
        console.error('Error triggering endpoint:', error);
      });
    }, 13 * 60 * 1000);
  })
  .catch((err) => console.log(`${err} did not connect`));
