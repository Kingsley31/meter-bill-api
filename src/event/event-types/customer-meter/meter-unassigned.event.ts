import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { CustomerMeterPayload } from './customer-meter.payload';

export class MeterUnassignedEvent extends BaseEvent {
  eventType: EventType.METER_UNASSIGNED;
  data: CustomerMeterPayload;
}
