import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { MeterTariffPayload } from './meter-tariff.payload';

export class MeterTariffCreatedEvent extends BaseEvent<MeterTariffPayload> {
  eventType: EventType.METER_TARIFF_CREATED;
  data: MeterTariffPayload;
}
