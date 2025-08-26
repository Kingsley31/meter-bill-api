import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { MeterPayload } from './meter.payload';

export class MeterCreatedEvent extends BaseEvent {
  eventType: EventType.METER_CREATED;
  data: MeterPayload;
}
