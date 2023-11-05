import { Router } from "express";
import * as controller from "../Controllers/AccessController.js";

const router = Router();

router.route("/").post(controller.checkMemberAccess);

export default router;
