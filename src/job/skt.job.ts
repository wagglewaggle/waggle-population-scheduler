import { Injectable } from '@nestjs/common';
import { BaseJob } from '../base/base.job';
import { JobType } from '../app/app.constant';
import { LoggerService } from '../app/logger/logger.service';
import { SentryService } from '../app/sentry/sentry.service';
import { SktPlaceService } from '../skt/skt-place/skt-place.service';
import { SktPopulationService } from '../skt/skt-population/skt-population.service';
import { SchedulerError } from '../app/error/scheduler.error';
import { config } from '../app/config/config.service';
import { SktPlace } from 'waggle-entity/dist/skt-place/skt-place.entity';
import axios, { AxiosResponse } from 'axios';
import { SktPopulationEntity } from '../skt/skt-population/entity/skt-population.entity';
import { ErrorLevel } from '../app/error/error.constant';
import { ISktCityData } from './skt-city-data.interface';

@Injectable()
export class SktJob extends BaseJob {
  jobName = 'SKT-POPULATION-JOB';
  jobType = JobType.SKT;
  cronTime = config.sktCronTime;
  private readonly API_HOST = 'https://apis.openapi.sk.com';
  private readonly API_URI = 'puzzle/place/congestion/rltm/pois';
  private readonly url: string;

  constructor(
    private readonly sktPlaceService: SktPlaceService,
    private readonly sktPopulationService: SktPopulationService,
    public readonly loggerService: LoggerService,
    public readonly sentryService: SentryService,
  ) {
    super(loggerService, sentryService);
    this.url = `${this.API_HOST}/${this.API_URI}`;
  }

  async run() {
    this.loggerService.log('start job', this.jobName);
    try {
      const places = await this.sktPlaceService.getSktPlaces();
      for (const place of places) {
        await this.updateSktPopulation(place);
      }
    } catch (e) {
      this.loggerService.error(JSON.stringify(e), this.jobName);
      throw new SchedulerError(JSON.stringify(e), ErrorLevel.Normal);
    }
    return { result: 'successfully end' };
  }

  async updateSktPopulation(place: SktPlace) {
    try {
      const updatedDate = new Date();
      const { data }: AxiosResponse<ISktCityData> = await axios.get(`${this.url}/${place.poiId}`, {
        headers: {
          appKey: config.sktCongestionApiKey,
        },
      });
      const {
        contents: { rltm },
      } = data;

      await this.sktPopulationService.addSktPopulation(new SktPopulationEntity(place, rltm, updatedDate));
    } catch (e) {
      throw e;
    }
  }
}
