import { Router } from "express";
import * as controller from "../Controllers/projectController.js";
import { checkAccessBearerToken } from "../../middlewares/jwtHandler.js";

const router = Router();

router.route("/").post(checkAccessBearerToken,controller.createProject);
router.route("/:userId").get(checkAccessBearerToken,controller.getProjects);
router.route("/details/:projectId/:userId").get(checkAccessBearerToken,controller.getProjectDetails);

export default router;
