import cookieParser from "cookie-parser";
import express, { Express, Request, Response } from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";

import env from "@/shared/configs/env";
import { setupSwagger } from "@/shared/configs/swagger";
import { errorHandler } from "@/shared/middlewares/error-handler";
import { notFoundHandler } from "@/shared/middlewares/not-found-handler";
import { rateLimiter } from "@/shared/middlewares/rate-limiter";
import { configureSecurityHeaders } from "@/shared/middlewares/security-header";

import Routes from "@/routes";

sourceMapSupport.install();

const app: Express = express();

// Apply security headers before other middlewares and routes
configureSecurityHeaders(app);

// Apply the rate limiting middleware to all requests
app.use(rateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Swagger Setup
setupSwagger(app);

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/api/health");
});

app.use("/api", Routes);

// Not found handler (should be after routes)
app.use(notFoundHandler);

// Global error handler (should be last)
app.use(errorHandler);

export default app;
