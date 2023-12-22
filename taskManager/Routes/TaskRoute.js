import { Router } from "express";
import * as controller from "../Controllers/TaskController.js";
import { checkAccessBearerToken } from "../../middlewares/jwtHandler.js";

const router = Router();

router.route("/").post(checkAccessBearerToken,controller.addTask);
router.route("/:projectId").get(checkAccessBearerToken,controller.getTasks);
router.route("/myTasks/:userId").get(checkAccessBearerToken,controller.getMyTasks);
router.route("/details/:taskId").get(checkAccessBearerToken,controller.getTaskDetails);
router.route("/getProjects/:userId").get(checkAccessBearerToken,controller.getProjects);
router.route("/getMembers/:projectId").get(checkAccessBearerToken,controller.getMembers);
router.route('/editTask').post(checkAccessBearerToken,controller.editTask)
router.route('/taskHistory/:taskId').get(checkAccessBearerToken,controller.getTaskHistory)
// router.route('/getDueTasks/get/new').get(controller.getDailyDueTask)

export default router;
