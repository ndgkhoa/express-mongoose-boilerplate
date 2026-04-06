import { exampleJob } from "@/shared/jobs/example.job";
import { systemMonitorJob } from "@/shared/jobs/system-monitor.job";
import { logger } from "@/shared/utils/logger";

/**
 * Initialize and start all background jobs
 */
export const initJobs = () => {
  exampleJob.start();
  systemMonitorJob.start();
  logger.info("Background jobs initialized.");
};
