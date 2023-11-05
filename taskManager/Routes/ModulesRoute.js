import { Router } from "express";

import * as controller from '../Controllers/ModuleController.js'

const router = Router()

router.route('/').post(controller.addModule)
router.route('/').get(controller.getModule)

export default router;