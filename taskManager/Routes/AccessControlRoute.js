import { Router } from "express";
import * as controller from "../Controllers/AccessController.js";
import { checkAccessBearerToken } from "../../middlewares/jwtHandler.js";

const router = Router();

router.route("/").post(checkAccessBearerToken,controller.checkMemberAccess);

export default router;
