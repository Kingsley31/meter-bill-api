import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { AreaTariffPayload } from './area-tariff.payload';

export class AreaTariffCreatedEvent extends BaseEvent<AreaTariffPayload> {
  eventType: EventType.AREA_TARIFF_CREATED;
  data: AreaTariffPayload;
}
