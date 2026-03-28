/**
 * Scraper of a concert portal must implement this interface in order to be taken into account and launched.
 */
export interface ICronJobService {
  /**
   * The name of the action.
   */
  readonly jobName: string;

  /**
   * The type determines how this job should be executed.
   */
  readonly jobType: "interval" | "timeout";

  /**
   * The action that should be executed as a Cron job.
   */
  run(): Promise<void>;

  /**
   * The earliest time in UTC datetime when the job can be executed again.
   */
  getRunDate(): Date;

  /**
   * Determines if the job is still in the process.
   */
  isInProcess(): boolean;
}
