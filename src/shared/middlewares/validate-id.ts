import { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { ApiError } from "@/shared/errors/api-error";

/**
 * Middleware to validate MongoDB ObjectId
 * @param paramName - The name of the parameter to validate (default: "id")
 */
export const validateObjectId = (paramName: string = "id") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value =
      req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (!value) {
      throw ApiError.badRequest(`${paramName} is required`);
    }

    if (!isValidObjectId(value)) {
      throw ApiError.badRequest(`Invalid ${paramName}`);
    }

    next();
  };
};
