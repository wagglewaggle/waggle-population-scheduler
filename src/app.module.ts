import { HttpException, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KtPlaceModule } from './kt/kt-place/kt-place.module';
import { KtPopulationModule } from './kt/kt-population/kt-population.module';
import { KtAccidentModule } from './kt/kt-accident/kt-accident.module';
import { KtRoadTrafficModule } from './kt/kt-road-traffic/kt-road-traffic.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { LoggerModule } from './app/logger/logger.module';
import { MysqlConfigService } from './app/mysql/mysql-config.service';
import { SchedulerModule } from './scheduler/scheduler.module';
import { JobModule } from './job/job.module';

export const TypeOrmRootModule = TypeOrmModule.forRootAsync({
  useClass: MysqlConfigService,
});

@Module({
  imports: [
    RavenModule,
    ScheduleModule.forRoot(),
    TypeOrmRootModule,
    KtPlaceModule,
    KtPopulationModule,
    KtAccidentModule,
    KtRoadTrafficModule,
    LoggerModule,
    SchedulerModule,
    JobModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        filters: [
          {
            type: HttpException,
          },
        ],
      }),
    },
  ],
})
export class AppModule {}
