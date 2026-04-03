import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/shared/errors/api-error";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  _next: NextFunction
) => {
  throw ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
};
