import { connectDB } from "@/shared/configs/db";
import env from "@/shared/configs/env";
import redisClient from "@/shared/configs/redis";
import { initJobs } from "@/shared/jobs";
import { logger } from "@/shared/utils/logger";
import { configureGracefulShutdown } from "@/shared/utils/shutdown";

import app from "@/app";

const port = env.PORT;

connectDB().then(() => {
  redisClient
    .connect()
    .then(() => {
      logger.info("Redis Connection Success");
      const server = app.listen(port, () => {
        logger.info(`[server]: Server is running at http://localhost:${port}`);
        logger.info(`[server]: Environment: ${env.NODE_ENV}`);
        logger.info(
          `[server]: Swagger docs are available at http://localhost:${port}/api/docs`
        );

        // Start background jobs after server starts
        initJobs();
      });

      configureGracefulShutdown(server);
    })
    .catch(error => {
      logger.error(error, "Redis Connection Failed");
      process.exit(1);
    });
});
