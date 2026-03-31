import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Interval, SchedulerRegistry } from "@nestjs/schedule";
import { minutesToMilliseconds } from "date-fns";
import { CRON_MANAGER_PROVIDERS } from "./constants";
import type { ICronJobService } from "./cron-job-service.interface";

@Injectable()
export class CronManagerService implements OnApplicationBootstrap {
  readonly #logger = new Logger(CronManagerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(CRON_MANAGER_PROVIDERS.cronJobServices) private readonly cronJobServices: ICronJobService[]
  ) {}

  onApplicationBootstrap() {
    this.#logger.log("Triggering initial cron jobs run");
    this.runJobs();
  }

  readonly #runJobMap: Record<ICronJobService["jobType"], (job: ICronJobService) => void> = {
    interval: (job) => this.#runIntervalJob(job),
    timeout: (job) => this.#runTimeoutJob(job),
  };

  @Interval(minutesToMilliseconds(10))
  runJobs() {
    this.cronJobServices
      .filter((cronJobService) => !cronJobService.isInProcess())
      .forEach((cronJobService) => {
        if (cronJobService.getRunDate().getTime() <= Date.now()) {
          this.#logger.log("Run job: " + cronJobService.jobName);
          const runJob = this.#runJobMap[cronJobService.jobType];
          runJob(cronJobService);
        }
      });
  }

  #runTimeoutJob(timeoutService: ICronJobService) {
    const timeout = setTimeout(async () => {
      try {
        await timeoutService.run();
        this.#logger.log("Job '" + timeoutService.jobName + "' has finished.");
      } catch (e) {
        this.#logger.error(
          "Job '" + timeoutService.jobName + "' thrown error: " + (e instanceof Error ? e.message : e),
          e
        );
      } finally {
        this.schedulerRegistry.deleteTimeout(timeoutService.jobName);
      }
    }, 1_000);
    this.schedulerRegistry.addTimeout(timeoutService.jobName, timeout);
  }

  #runIntervalJob(intervalService: ICronJobService) {
    const interval = setInterval(async () => {
      try {
        await intervalService.run();

        if (intervalService.getRunDate().getTime() > Date.now()) {
          this.schedulerRegistry.deleteInterval(intervalService.jobName);
          this.#logger.log("Job '" + intervalService.jobName + "' has finished.");
        }
      } catch (e) {
        this.#logger.error(
          "Job '" + intervalService.jobName + "' thrown error: " + (e instanceof Error ? e.message : e),
          e
        );
      }
    }, 1_000);
    this.schedulerRegistry.addInterval(intervalService.jobName, interval);
  }
}
