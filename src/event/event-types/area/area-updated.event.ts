import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { AreaPayload } from './area.payload';

export class AreaUpdatedEvent extends BaseEvent<{
  old: AreaPayload;
  new: AreaPayload;
}> {
  eventType: EventType.AREA_UPDATED;
  data: { old: AreaPayload; new: AreaPayload };
}
