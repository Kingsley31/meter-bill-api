import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { AreaPayload } from './area.payload';

export class AreaCreatedEvent extends BaseEvent {
  eventType: EventType.AREA_CREATED;
  data: AreaPayload;
}
