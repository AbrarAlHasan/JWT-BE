import cron from "node-cron";
import { getDailyDueTask } from "../Controllers/TaskController.js";

export const NotifyDailyDueTask = cron.schedule(
  "25 9 * * *",
  async () => {
    console.log('Sheduler Trigerred')
    await getDailyDueTask();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // Change timezone as per your location
  }
);
