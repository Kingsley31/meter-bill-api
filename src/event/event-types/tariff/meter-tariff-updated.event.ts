import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { MeterTariffPayload } from './meter-tariff.payload';

export class MeterTariffUpdatedEvent extends BaseEvent<{
  old: MeterTariffPayload;
  new: MeterTariffPayload;
}> {
  eventType: EventType.METER_TARIFF_UPDATED;
  data: { old: MeterTariffPayload; new: MeterTariffPayload };
}
