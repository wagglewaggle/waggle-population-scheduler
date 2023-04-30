import { Module } from '@nestjs/common';
import { SentryModule } from '../app/sentry/sentry.module';
import { LoggerModule } from '../app/logger/logger.module';
import { KtPlaceModule } from '../kt/kt-place/kt-place.module';
import { KtPopulationModule } from '../kt/kt-population/kt-population.module';
import { KtAccidentModule } from '../kt/kt-accident/kt-accident.module';
import { KtRoadTrafficModule } from '../kt/kt-road-traffic/kt-road-traffic.module';
import { KtJob } from './kt.job';

@Module({
  imports: [LoggerModule, SentryModule, KtPlaceModule, KtPopulationModule, KtAccidentModule, KtRoadTrafficModule],
  providers: [KtJob],
  exports: [KtJob],
})
export class JobModule {}
