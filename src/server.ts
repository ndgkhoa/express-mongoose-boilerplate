import { connectDB } from "@/shared/configs/db";
import env from "@/shared/configs/env";
import { initJobs } from "@/shared/jobs";
import { logger } from "@/shared/utils/logger";
import { configureGracefulShutdown } from "@/shared/utils/shutdown";

import app from "@/app";

const port = env.PORT;

connectDB()
  .then(() => {
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
    logger.error(error, "MongoDB Connection Failed:");
    process.exit(1);
  });
