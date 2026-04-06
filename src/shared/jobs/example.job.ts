import cron from "node-cron";

import { logger } from "@/shared/utils/logger";

/**
 * Example background job that runs every minute
 */
export const exampleJob = cron.schedule("* * * * *", () => {
  logger.info("Background job running every minute...");
});
