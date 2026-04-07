import { Request, Response, Router } from "express";

import { authorizeRoles } from "@/shared/middlewares/authorize-role";
import { verifyAuthentication } from "@/shared/middlewares/verify-auth";
import { ApiResponse } from "@/shared/utils/api-response";

import { UserRoleConst } from "@/types/enums";

const router: Router = Router();

// Validates 'id' param by default
// router.get("/:id", validateObjectId(), getUserById);

// Validates custom param name 'userId'
// router.delete("/:userId", validateObjectId("userId"), deleteUser);

router.get(
  "/profile",
  verifyAuthentication,
  authorizeRoles(UserRoleConst.USER, UserRoleConst.ADMIN),
  (req: Request, res: Response) => {
    return ApiResponse.ok(res, "User profile", req.user);
  }
);

export default router;
