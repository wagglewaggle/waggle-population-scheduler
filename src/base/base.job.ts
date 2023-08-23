import { Injectable } from '@nestjs/common';
import { LoggerService } from '../app/logger/logger.service';
import { SentryService } from '../app/sentry/sentry.service';
import { JobType } from '../app/app.constant';
import { CronJob, CronTime } from 'cron';
import { SchedulerError } from '../app/error/scheduler.error';
import { ErrorLevel } from '../app/error/error.constant';

@Injectable()
export abstract class BaseJob {
  abstract jobName: string;
  abstract jobType: JobType;
  abstract cronTime: string;
  cronJob: CronJob;

  constructor(public readonly loggerService: LoggerService, public readonly sentryService: SentryService) {}

  async start() {
    if (!this.isValidateCronTime()) {
      this.loggerService.error(`invalid cron time: ${this.cronTime}`, this.jobName);
      return;
    }

    this.cronJob = new CronJob(this.cronTime, () => this.handle());

    this.loggerService.log(this.cronTime, this.jobName);
    this.cronJob.start();
  }

  async handle() {
    try {
      const start = new Date();
      const result = await this.run();
      const end = new Date();
      const diff = (end.getTime() - start.getTime()) / 1000;
      this.loggerService.log(JSON.stringify({ ...result, elapsed: `${diff}s` }), this.jobName);
    } catch (e) {
      this.handleError(e);
    }
  }

  handleError(e: any) {
    if (e instanceof SchedulerError) {
      this.loggerService.error(e.message, this.jobName);
      this.sentryService.sendError(e, this.jobType);
      if (e.errorLevel === ErrorLevel.Fatal) {
        this.cronJob.stop();
        this.loggerService.error('job stopped', this.jobName);
      }
    } else {
      this.loggerService.error(e, this.jobName);
      this.sentryService.sendError(e, this.jobType);
      this.cronJob.stop();
      this.loggerService.error('job stopped', this.jobName);
    }
  }

  isValidateCronTime(): boolean {
    try {
      new CronTime(this.cronTime);
      return true;
    } catch (e) {
      return false;
    }
  }

  abstract run(): Promise<Record<string, any>>;
}
