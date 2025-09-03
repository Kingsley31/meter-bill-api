import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { AreaPayload } from './area.payload';

export class AreaCreatedEvent extends BaseEvent<AreaPayload> {
  eventType: EventType.AREA_CREATED;
  data: AreaPayload;
}
