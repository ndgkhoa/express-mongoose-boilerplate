import { Router } from "express";
import HealthRouter from "@/modules/health/health.routes";

const router: Router = Router();

router.use("/health", HealthRouter);

export default router;
