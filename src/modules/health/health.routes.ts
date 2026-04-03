import { Router } from "express";
import { healthCheck, detailedHealthCheck } from "@/modules/health/health.controller";

const router: Router = Router();

router.get("/", healthCheck);
router.get("/detailed", detailedHealthCheck);

export default router;
