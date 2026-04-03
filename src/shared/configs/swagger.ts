import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import env from "@/shared/configs/env";

const swaggerPath = path.resolve(process.cwd(), "src/docs/swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));

export const setupSwagger = (app: Express) => {
  if (env.NODE_ENV !== "development") return;
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
