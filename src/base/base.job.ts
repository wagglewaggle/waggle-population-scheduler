import { Injectable } from '@nestjs/common';
import { LoggerService } from '../app/logger/logger.service';
import { SentryService } from '../app/sentry/sentry.service';
import { JobType } from '../app/app.constant';
import { CronJob, CronTime } from 'cron';

@Injectable()
export abstract class BaseJob {
  abstract jobName: string;
  abstract jobType: JobType;
  abstract cronTime: string;
  cronJob: CronJob;

  constructor(public readonly loggerService: LoggerService, public readonly sentryService: SentryService) {}

  async start() {
    try {
      if (!this.isValidateCronTime()) {
        this.loggerService.error(`invalid cron time: ${this.cronTime}`, this.jobName);
        return;
      }

      this.cronJob = new CronJob(this.cronTime, () => this.handle());

      this.loggerService.log('start job', this.jobName);
      this.cronJob.start();
    } catch (e) {
      this.loggerService.error(JSON.stringify(e), this.jobName);
      this.sentryService.sendError(e, this.jobType);
    }
  }

  async handle() {
    try {
      const start = new Date();
      const result = await this.run();
      const end = new Date();
      const diff = (end.getTime() - start.getTime()) / 1000;
      this.loggerService.log(JSON.stringify({ ...result, elapsed: `${diff}s` }), this.jobName);
    } catch (e) {
      this.loggerService.error(JSON.stringify(e), this.jobName);
      this.sentryService.sendError(e, this.jobType);
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
