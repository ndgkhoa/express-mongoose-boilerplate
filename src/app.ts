import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import Routes from "@/routes";

import { configureSecurityHeaders } from "@/shared/middlewares/security-header";
import { errorHandler } from "@/shared/middlewares/error-handler";
import { notFoundHandler } from "@/shared/middlewares/not-found-handler";
import { setupSwagger } from "@/shared/configs/swagger";
import env from "@/shared/configs/env";

import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

const app: Express = express();

// Apply security headers before other middlewares and routes
configureSecurityHeaders(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Swagger Setup
setupSwagger(app);

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/health");
});

app.use(Routes);

// Not found handler (should be after routes)
app.use(notFoundHandler);

// Global error handler (should be last)
app.use(errorHandler);

export default app;
