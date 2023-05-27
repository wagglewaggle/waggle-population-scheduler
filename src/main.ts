import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import { config } from './app/config/config.service';
import { SchedulerService } from './scheduler/scheduler.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (config.useSentry) {
    Sentry.init({ dsn: config.sentryDsn });
  }

  const schedulerService = app.get<SchedulerService>(SchedulerService);
  schedulerService.start();
}
bootstrap();
