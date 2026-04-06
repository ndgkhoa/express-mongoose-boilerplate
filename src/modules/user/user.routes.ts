import { Request, Response, Router } from "express";

import { authorizeRoles } from "@/shared/middlewares/authorize-role";
import { validateRequest } from "@/shared/middlewares/validate-request";
import { verifyAuthentication } from "@/shared/middlewares/verify-auth";
import { ApiResponse } from "@/shared/utils/api-response";

import { createUserSchema } from "@/modules/user/user.validation";

const router: Router = Router();

router.post("/", validateRequest(createUserSchema), (req, res) => {
  return res.status(201).json({ success: true, data: req.body });
});

// Validates 'id' param by default
// router.get("/:id", validateObjectId(), getUserById);

// Validates custom param name 'userId'
// router.delete("/:userId", validateObjectId("userId"), deleteUser);

router.get(
  "/profile",
  verifyAuthentication,
  authorizeRoles("user", "admin"),
  (req: Request, res: Response) => {
    return ApiResponse.ok(res, "User profile", req.user);
  }
);

export default router;
