import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JobModule } from '../job/job.module';
import { LoggerModule } from '../app/logger/logger.module';

@Module({
  imports: [JobModule, LoggerModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
