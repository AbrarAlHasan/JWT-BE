import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AuthRouter from "./routes/AuthRouter.js";

dotenv.config();

const app = express();
const port = process.env.port || 8000;

app.use(cors());
app.use(express.json());

app.use("/", AuthRouter);

const uri = process.env.MONGODB_URI;
const environment = process.env.ENVIRONMENT;

mongoose.set("strictQuery", true);
mongoose
  .connect(uri, { dbName: "w2sMachineTask" })
  .then(() => {
    app.listen(port, () => {
      console.log(
        `Database is Connected and Server is Running on Port:${port}`
      );
    });
  })
  .catch((err) => console.log(`${err} did not connect`));
