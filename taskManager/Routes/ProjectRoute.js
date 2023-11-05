import { Router } from "express";
import * as controller from "../Controllers/projectController.js";

const router = Router();

router.route("/").post(controller.createProject);
router.route("/:userId").get(controller.getProjects);
router.route("/details/:projectId/:userId").get(controller.getProjectDetails);

export default router;
