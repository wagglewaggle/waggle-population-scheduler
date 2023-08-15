import { Injectable } from '@nestjs/common';
import { BaseJob } from '../base/base.job';
import { LoggerService } from '../app/logger/logger.service';
import { SentryService } from '../app/sentry/sentry.service';
import { JobType } from '../app/app.constant';
import { KtPlaceService } from '../kt/kt-place/kt-place.service';
import { KtPopulationService } from '../kt/kt-population/kt-population.service';
import { KtAccidentService } from '../kt/kt-accident/kt-accident.service';
import { KtRoadTrafficService } from '../kt/kt-road-traffic/kt-road-traffic.service';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { KtPlace } from 'waggle-entity/dist/kt-place/kt-place.entity';
import { KtAccidentEntity } from '../kt/kt-accident/entity/kt-accident.entity';
import { XMLParser } from 'fast-xml-parser';
import { SchedulerError } from '../app/error/scheduler.error';
import { ErrorLevel } from '../app/error/error.constant';
import Axios from 'axios';
import { config } from '../app/config/config.service';
import { KtPopulationEntity } from '../kt/kt-population/entity/kt-population.entity';
import { KtRoadTrafficEntity } from '../kt/kt-road-traffic/entity/kt-road-traffic.entity';
import { IAccidentObject, IKtCityData } from './city-data.interface';
import { KtApi } from './job.constant';

@Injectable()
export class KtJob extends BaseJob {
  jobName = 'KT-POPULATION-JOB';
  jobType = JobType.KT;
  cronTime = config.ktCronTime;
  private readonly xmlParser: XMLParser;
  private readonly url: string;

  constructor(
    private readonly ktPlaceService: KtPlaceService,
    private readonly ktPopulationService: KtPopulationService,
    private readonly ktAccidentService: KtAccidentService,
    private readonly ktRoadTrafficService: KtRoadTrafficService,
    private readonly dataSource: DataSource,
    public readonly loggerService: LoggerService,
    public readonly sentryService: SentryService,
  ) {
    super(loggerService, sentryService);
    this.xmlParser = new XMLParser();
    this.url = `${KtApi.HOST}/${config.ktApiKey}/${KtApi.ENDPOINT}`;
  }

  async run(): Promise<Record<string, any>> {
    this.loggerService.log('job started', this.jobName);
    try {
      const places = await this.ktPlaceService.getActivatedPlaces();

      for await (const place of places) {
        const connection = this.dataSource;
        const queryRunner: QueryRunner = connection.createQueryRunner();
        const manager = queryRunner.manager;
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
          const { data } = await Axios.get(`${this.url}/${place.name}`);
          const result: IKtCityData = await this.xmlParser.parse(data);

          if (result['SeoulRtd.citydata'] === undefined) {
            this.loggerService.error(`undefined citydata : ${place.name}(${place.idx})`, this.jobName);
            continue;
          }

          await this.updateKtAccident(place, result['SeoulRtd.citydata'].CITYDATA.ACDNT_CNTRL_STTS, manager);
          await this.ktPopulationService.addKtPopulation(
            new KtPopulationEntity(place, result['SeoulRtd.citydata'].CITYDATA.LIVE_PPLTN_STTS, new Date()),
            manager,
          );

          /** roadTraffic이 undefined일 경우에 대한 방어로직 */
          const roadTraffic = result['SeoulRtd.citydata'].CITYDATA.ROAD_TRAFFIC_STTS.AVG_ROAD_DATA;
          if (roadTraffic) {
            await this.ktRoadTrafficService.addKtRoadTraffic(new KtRoadTrafficEntity(place, roadTraffic), manager);
          }

          await queryRunner.commitTransaction();
          this.loggerService.log(`[${place.name}(${place.idx})] successfully updated`, this.jobName);
        } catch (e) {
          this.loggerService.error(`[${place.name}(${place.idx})] update failed`, this.jobName);
          if (queryRunner.isTransactionActive) {
            await queryRunner.rollbackTransaction();
          }
          if (e instanceof SchedulerError) {
            if (e.errorLevel === ErrorLevel.Normal) {
              this.loggerService.error(e.message, this.jobName);
              continue;
            }
            throw e;
          }

          throw new SchedulerError(`${place.idx} : ${e}`, ErrorLevel.Fatal);
        } finally {
          await queryRunner.release();
        }
      }

      return { result: 'successfully end' };
    } catch (e) {
      throw e;
    }
  }

  private async updateKtAccident(place: KtPlace, accident: string | IAccidentObject, manager?: EntityManager) {
    try {
      // 새로운 로그가 쌓이든 안 쌓이든 항상 전처리를 하도록 한다.
      await this.preprocessKtAccident(place, manager);

      if (typeof accident !== 'string') {
        const { ACDNT_CNTRL_STTS } = accident;
        if (Array.isArray(ACDNT_CNTRL_STTS)) {
          await Promise.all(ACDNT_CNTRL_STTS.map((accident) => this.ktAccidentService.addKtAccident(new KtAccidentEntity(place, accident), manager)));
        } else {
          await this.ktAccidentService.addKtAccident(new KtAccidentEntity(place, ACDNT_CNTRL_STTS), manager);
        }
      }
    } catch (e) {
      throw new SchedulerError(`${place.idx} : ${e}`, ErrorLevel.Normal);
    }
  }

  private async preprocessKtAccident(place: KtPlace, manager?: EntityManager) {
    const placeAccidents = await this.ktPlaceService.getKtPlaceAndAccidents(place.idx);
    if (!placeAccidents) {
      throw new SchedulerError(`not found kt place : ${place.idx}`, ErrorLevel.Normal);
    }
    await Promise.all(placeAccidents.accidents.map((accident) => this.ktAccidentService.deleteKtAccident(accident, manager)));
  }
}
