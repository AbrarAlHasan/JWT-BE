import { Router } from "express";
import * as controller from "../Controllers/TaskController.js";

const router = Router();

router.route("/").post(controller.addTask);
router.route("/:projectId").get(controller.getTasks);
router.route("/myTasks/:userId").get(controller.getMyTasks);
router.route("/details/:taskId").get(controller.getTaskDetails);
router.route("/getProjects/:userId").get(controller.getProjects);
router.route("/getMembers/:projectId").get(controller.getMembers);

export default router;
