import cron from "node-cron";
import os from "os";

import { logger } from "@/shared/utils/logger";

export const systemMonitorJob = cron.schedule("*/15 * * * *", () => {
  const freeMem = os.freemem() / 1024 / 1024;
  const totalMem = os.totalmem() / 1024 / 1024;
  const usage = ((totalMem - freeMem) / totalMem) * 100;

  logger.info(`System health: ${usage.toFixed(2)}% memory usage`);

  if (usage > 90) {
    // Trigger alert or notification
    logger.warn("High memory usage detected!");
  }
});
