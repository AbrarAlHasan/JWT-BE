import { Router } from "express";
import * as controller from "../Controllers/ProjectMemberController.js";

const router = Router();

router.route("/").post(controller.addProjectMember);
router.route("/checkUser").get(controller.checkUser);
router.route("/:projectId/:memberId").get(controller.getMembers);
router.route('/getMemberId').post(controller.getMemberDetails)

export default router;
