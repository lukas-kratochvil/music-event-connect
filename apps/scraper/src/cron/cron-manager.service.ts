import {
  MusicEventsQueue,
  type MusicEventsQueueDataType,
  type MusicEventsQueueNameType,
} from "@music-event-connect/core/queue";
import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Interval, SchedulerRegistry } from "@nestjs/schedule";
import type { Queue } from "bullmq";
import { minutesToMilliseconds } from "date-fns";
import { CRON_MANAGER_PROVIDERS } from "./constants";
import type { ICronJobService } from "./cron-job-service.interface";

@Injectable()
export class CronManagerService implements OnApplicationBootstrap {
  readonly #logger = new Logger(CronManagerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectQueue(MusicEventsQueue.name)
    private readonly musicEventsQueue: Queue<
      MusicEventsQueueDataType,
      MusicEventsQueueDataType,
      MusicEventsQueueNameType
    >,
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

  async #runService(service: ICronJobService) {
    for await (const event of service.run()) {
      await this.musicEventsQueue.add(service.jobName, event);
    }
  }

  #runTimeoutJob(service: ICronJobService) {
    const timeout = setTimeout(async () => {
      try {
        await this.#runService(service);
        this.#logger.log("Job '" + service.jobName + "' has finished.");
      } catch (e) {
        this.#logger.error("Job '" + service.jobName + "' thrown error: " + (e instanceof Error ? e.message : e), e);
      } finally {
        this.schedulerRegistry.deleteTimeout(service.jobName);
      }
    }, 1_000);
    this.schedulerRegistry.addTimeout(service.jobName, timeout);
  }

  #runIntervalJob(service: ICronJobService) {
    const interval = setInterval(async () => {
      try {
        await this.#runService(service);

        if (service.getRunDate().getTime() > Date.now()) {
          this.schedulerRegistry.deleteInterval(service.jobName);
          this.#logger.log("Job '" + service.jobName + "' has finished.");
        }
      } catch (e) {
        this.#logger.error("Job '" + service.jobName + "' thrown error: " + (e instanceof Error ? e.message : e), e);
      }
    }, 1_000);
    this.schedulerRegistry.addInterval(service.jobName, interval);
  }
}
