import { Injectable } from '@nestjs/common';
import { KtJob } from '../job/kt.job';
import { LoggerService } from '../app/logger/logger.service';
import { SktJob } from '../job/skt.job';

@Injectable()
export class SchedulerService {
  constructor(private readonly loggerService: LoggerService, private readonly ktJob: KtJob, private readonly sktJob: SktJob) {}

  async start() {
    try {
      this.ktJob.start();
      this.sktJob.start();
    } catch (e) {
      this.loggerService.error('[GLOBAL]: Failed to start scheduler', e);
    }
  }
}
