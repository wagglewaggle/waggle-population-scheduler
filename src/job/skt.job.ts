import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from '../app/logger/logger.service';
import { SentryService } from '../app/sentry/sentry.service';
import { SktPlaceService } from '../skt/skt-place/skt-place.service';
import { SktPopulationService } from '../skt/skt-population/skt-population.service';
import { SktDefaultInfo } from '../skt/skt-job/skt-job.constant';
import { JobType } from '../app/app.constant';
import { SktPlace } from 'waggle-entity/dist/skt-place/skt-place.entity';
import { ISktCityData } from '../skt/skt-job/skt-city-data.interface';
import axios, { AxiosResponse } from 'axios';
import { SktPopulationEntity } from '../skt/skt-population/entity/skt-population.entity';
import { config } from '../app/config/config.service';

@Injectable()
export class SktJobService {
  private readonly jobName: string = 'SKT JOB';
  private readonly blackListSentry: string[];
  private readonly url: string;

  constructor(
    private readonly sktPlaceService: SktPlaceService,
    private readonly sktPopulationService: SktPopulationService,
    private readonly sentryService: SentryService,
    private readonly loggerService: LoggerService,
  ) {
    this.url = `${SktDefaultInfo.API_HOST}/${SktDefaultInfo.API_URI}`;
  }

  @Cron('0 */1 * * *')
  async run() {
    try {
      const places = await this.sktPlaceService.getSktPlaces();
      for (const place of places) {
        await this.updateSktPopulation(place);
      }

      // this.loggerService.log(`!!!${this.jobName}!!! successfully done`);
    } catch (e) {
      // this.loggerService.error(`!!!${this.jobName}!!! ${JSON.stringify(e)}`);

      if (!this.blackListSentry.includes(e)) {
        this.sentryService.sendError(e, JobType.SKT);
      }
    }
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
      throw { error: e, place };
    }
  }
}
