import { Router } from "express";
import * as controller from "../Controllers/UserController.js";

const router = Router();

router.route("/").post(controller.addUser);
router.route("/login").post(controller.getUser);

export default router;
