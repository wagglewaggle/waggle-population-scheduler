import { Injectable } from '@nestjs/common';
import { KtJob } from '../job/kt.job';
import { LoggerService } from '../app/logger/logger.service';

@Injectable()
export class SchedulerService {
  constructor(private readonly loggerService: LoggerService, private readonly ktJob: KtJob) {}

  async start() {
    try {
      this.ktJob.start();
    } catch (e) {
      this.loggerService.error('[GLOBAL]: Failed to start scheduler', e);
    }
  }
}
