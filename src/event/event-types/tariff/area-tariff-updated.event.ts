import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { AreaTariffPayload } from './area-tariff.payload';

export class AreaTariffUpdatedEvent extends BaseEvent<{
  old: AreaTariffPayload;
  new: AreaTariffPayload;
}> {
  eventType: EventType.AREA_TARIFF_UPDATED;
  data: { old: AreaTariffPayload; new: AreaTariffPayload };
}
