import { Router } from "express";
import * as controller from "../controllers/authController.js";

const router = Router();

router.route("/signup").post(controller.signup);
router.route("/login").post(controller.login);
router.route("/currentSession").post(controller.checkCurrentSession);
router.route("/verifyOTP").post(controller.verifyOTP, controller.verifyUser);
router.route("/forgetPassword").post(controller.forgetPass);
router.route("/getAllUsers").get(controller.getAllUsers);
router
  .route("/resetPassword")
  .post(controller.verifyOTP, controller.changePassword);

export default router;
