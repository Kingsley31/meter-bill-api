import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { MeterTariffService } from './meter-tariff.service';
import { CreateMeterTariffDto } from './dto/create-meter-tariff.dto';
import { AreaTariffService } from './area-tariff.service';
import { CreateAreaTariffDto } from './dto/create-area-tariff.dto';
import { AreaTariffCreatedEvent } from 'src/event/event-types/tariff/area-tariff-created.event';
import { EventType } from 'src/event/enums';
import { EventService } from 'src/event/event.service';
import { AreaTariffPayload } from 'src/event/event-types/tariff/area-tariff.payload';
import { MeterTariffPayload } from 'src/event/event-types/tariff/meter-tariff.payload';
import { MeterTariffCreatedEvent } from 'src/event/event-types/tariff/meter-tariff-created.event';
import { TariffType } from './enums';
import { MeterConsumptionTariff } from './types';
import { FAR_FUTURE_DATE } from './constants';
import { MeterTariffUpdatedEvent } from 'src/event/event-types/tariff/meter-tariff-updated.event';
import { AreaTariffUpdatedEvent } from 'src/event/event-types/tariff/area-tariff-updated.event';

@Injectable()
export class TariffService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly meterTariffService: MeterTariffService,
    private readonly areaTariffService: AreaTariffService,
    private readonly eventService: EventService,
  ) {}

  async createMeterTariff(createMeterTariffDto: CreateMeterTariffDto) {
    const meterTariffExist =
      await this.meterTariffService.checkTariffAlreadyExist(
        createMeterTariffDto,
      );
    if (meterTariffExist) {
      throw new BadRequestException(
        'Meter already has this tariff set, no need to update.',
      );
    }
    const lastSetTariff = await this.meterTariffService.getLastTariffForMeter({
      meterId: createMeterTariffDto.meterId,
    });
    if (
      lastSetTariff &&
      lastSetTariff.effectiveFrom > createMeterTariffDto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Cannot set a tariff with an effective date earlier than the last set tariff.',
      );
    }
    const createdMeterTariff = await this.meterTariffService.createTariff({
      ...createMeterTariffDto,
      endDate: FAR_FUTURE_DATE,
    });
    if (lastSetTariff) {
      const endDate = new Date(createMeterTariffDto.effectiveFrom);
      endDate.setDate(endDate.getDate() - 1);
      const updatedLastSetTariff =
        await this.meterTariffService.updateMeterTariffEndDate({
          tariffId: lastSetTariff.id,
          endDate: endDate,
        });
      const oldTariffData: MeterTariffPayload = {
        ...lastSetTariff,
        tariff: Number(lastSetTariff.tariff),
      };
      const newTariffData: MeterTariffPayload = {
        ...updatedLastSetTariff,
        tariff: Number(updatedLastSetTariff.tariff),
      };
      const lastMeterTariffUpdatedEvent = new MeterTariffUpdatedEvent(
        EventType.METER_TARIFF_UPDATED,
        { old: oldTariffData, new: newTariffData },
      );
      this.eventService.publish(
        EventType.METER_TARIFF_UPDATED,
        lastMeterTariffUpdatedEvent,
      );
    }
    const mapCreatedMeterTariff: MeterTariffPayload = {
      ...createdMeterTariff,
      tariff: Number(createdMeterTariff.tariff),
    };
    const event = new MeterTariffCreatedEvent(
      EventType.METER_TARIFF_CREATED,
      mapCreatedMeterTariff,
    );
    this.eventService.publish(EventType.METER_TARIFF_CREATED, event);
    return true;
  }

  async getAreaCurrentDateTariff(params: { areaId: string; date: Date }) {
    const areaCurrentDateTariff =
      await this.areaTariffService.getAreaCurrentDateTariff({
        currentDate: params.date,
        areaId: params.areaId,
      });
    return areaCurrentDateTariff;
  }

  async getMeterCurrentDateTariff(params: { meterId: string; date: Date }) {
    const meterCurrentTariff =
      await this.meterTariffService.getActiveMeterTariffByDate({
        meterId: params.meterId,
        date: params.date,
      });
    return meterCurrentTariff;
  }

  async getActiveMeterTariffByConsumptionDate(params: {
    meterId: string;
    areaId: string;
    consumptionDate: Date;
  }): Promise<MeterConsumptionTariff | null> {
    // Retrieve and return the Meter Tariff if it exist
    const meterCurrentTariff = await this.getMeterCurrentDateTariff({
      meterId: params.meterId,
      date: params.consumptionDate,
    });
    if (meterCurrentTariff) {
      return {
        tariffId: meterCurrentTariff.id,
        effectiveFrom: meterCurrentTariff.effectiveFrom,
        tariff: Number(meterCurrentTariff.tariff),
        endDate: meterCurrentTariff.endDate,
        tariffType: TariffType.METER_TARIFF,
      };
    }

    // Retrieve and return the Meter Area Tariff if it exist
    const areaCurrentDateTariff = await this.getAreaCurrentDateTariff({
      date: params.consumptionDate,
      areaId: params.areaId,
    });
    if (areaCurrentDateTariff) {
      return {
        tariffId: areaCurrentDateTariff.id,
        effectiveFrom: areaCurrentDateTariff.effectiveFrom,
        tariff: Number(areaCurrentDateTariff.tariff),
        endDate: areaCurrentDateTariff.endDate,
        tariffType: TariffType.AREA_TARIFF,
      };
    }
    return null;
  }

  async listMeterTariff(
    meterId: string,
    filter: {
      tariff?: number;
      effectiveFromStart?: Date;
      effectiveFromEnd?: Date;
      page: number;
      pageSize: number;
    },
  ) {
    const paginatedTariffs = await this.meterTariffService.getTariffsByMeterId(
      meterId,
      filter,
    );
    return paginatedTariffs;
  }

  async createAreaTariff(createAreaTariffDto: CreateAreaTariffDto) {
    const areaTariffExist =
      await this.areaTariffService.checkTariffAlreadyExist(createAreaTariffDto);
    if (areaTariffExist) {
      throw new BadRequestException(
        'Area already has this tariff set, no need to update.',
      );
    }
    const lastSetTariff = await this.areaTariffService.getLastTariffForArea({
      areaId: createAreaTariffDto.areaId,
    });
    if (
      lastSetTariff &&
      lastSetTariff.effectiveFrom > createAreaTariffDto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Cannot set a tariff with an effective date earlier than the last set tariff.',
      );
    }
    const createdAreaTariff = await this.areaTariffService.createTariff({
      areaId: createAreaTariffDto.areaId,
      areaName: createAreaTariffDto.areaName,
      tariff: createAreaTariffDto.tariff,
      effectiveFrom: createAreaTariffDto.effectiveFrom,
      endDate: FAR_FUTURE_DATE,
    });
    if (lastSetTariff) {
      const endDate = new Date(createAreaTariffDto.effectiveFrom);
      endDate.setDate(endDate.getDate() - 1);
      const updatedLastSetTariff =
        await this.areaTariffService.updateAreaTariffEndDate({
          tariffId: lastSetTariff.id,
          endDate: endDate,
        });
      const oldTariffData: AreaTariffPayload = {
        ...lastSetTariff,
        tariff: Number(lastSetTariff.tariff),
      };
      const newTariffData: AreaTariffPayload = {
        ...updatedLastSetTariff,
        tariff: Number(updatedLastSetTariff.tariff),
      };
      const lastAreaTariffUpdatedEvent = new AreaTariffUpdatedEvent(
        EventType.AREA_TARIFF_UPDATED,
        { old: oldTariffData, new: newTariffData },
      );
      this.eventService.publish(
        EventType.AREA_TARIFF_UPDATED,
        lastAreaTariffUpdatedEvent,
      );
    }
    const mapCreatedAreaTariff: AreaTariffPayload = {
      ...createdAreaTariff,
      tariff: Number(createdAreaTariff.tariff),
    };
    const event = new AreaTariffCreatedEvent(
      EventType.AREA_TARIFF_CREATED,
      mapCreatedAreaTariff,
    );
    this.eventService.publish(EventType.AREA_TARIFF_CREATED, event);
    return true;
  }

  async listAreaTariffs(
    areaId: string,
    filter: {
      tariff?: number;
      effectiveFromStart?: Date;
      effectiveFromEnd?: Date;
      page: number;
      pageSize: number;
    },
  ) {
    const paginatedTariffs = await this.areaTariffService.getTariffsByAreaId(
      areaId,
      filter,
    );
    return paginatedTariffs;
  }
}
