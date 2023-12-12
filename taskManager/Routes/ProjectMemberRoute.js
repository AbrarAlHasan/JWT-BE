import { Router } from "express";
import * as controller from "../Controllers/ProjectMemberController.js";
import { checkAccessBearerToken } from "../../middlewares/jwtHandler.js";

const router = Router();

router.route("/").post(checkAccessBearerToken,controller.addProjectMember);
router.route("/checkUser").get(checkAccessBearerToken,controller.checkUser);
router.route("/:projectId/:memberId").get(checkAccessBearerToken,controller.getMembers);
router.route('/getMemberId').post(checkAccessBearerToken,controller.getMemberDetails)

export default router;
