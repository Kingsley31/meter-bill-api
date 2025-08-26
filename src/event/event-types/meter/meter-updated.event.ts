import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { MeterPayload } from './meter.payload';

export class MeterUpdatedEvent extends BaseEvent {
  eventType: EventType.METER_UPDATED;
  data: { old: MeterPayload; new: MeterPayload };
}
