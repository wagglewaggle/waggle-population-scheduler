import { Injectable } from '@nestjs/common';
import { KtPlace } from 'waggle-entity/dist/kt-place/kt-place.entity';
import { KtPlaceRepository } from './kt-place.repository';
import { KtPlaceStatus } from 'waggle-entity/dist/kt-place/kt-place.constant';

@Injectable()
export class KtPlaceService {
  constructor(private readonly ktPlaceRepository: KtPlaceRepository) {}

  async getKtPlaces(): Promise<KtPlace[]> {
    return await this.ktPlaceRepository.getKtPlace();
  }

  async getActivatedPlaces(): Promise<KtPlace[]> {
    return this.ktPlaceRepository.getKtPlace({ status: KtPlaceStatus.Activated });
  }

  async getKtPlace(idx: number): Promise<KtPlace | undefined> {
    const [place] = await this.ktPlaceRepository.getKtPlace({ idx });
    return place;
  }

  async getKtPlaceAndAccidents(idx: number): Promise<KtPlace | undefined> {
    const [place] = await this.ktPlaceRepository.getKtPlace({ idx }, ['accidents']);
    return place;
  }
}
