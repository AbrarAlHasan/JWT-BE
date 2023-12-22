import { NotifyDailyDueTask } from "./NotifyDueDateTask.js";

export default function runAllCronShedulers() {
  NotifyDailyDueTask.start();
  
}
