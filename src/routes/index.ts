import { Router } from "express";

import authRoutes from "@/modules/auth/auth.routes";
import healthRoutes from "@/modules/health/health.routes";
import usersRouter from "@/modules/user/user.routes";

const router: Router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRouter);

export default router;
