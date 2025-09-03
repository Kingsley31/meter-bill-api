import { EventType } from '../../enums';
import { BaseEvent } from '../base.event';
import { CustomerMeterPayload } from './customer-meter.payload';

export class MeterAssignedEvent extends BaseEvent<CustomerMeterPayload> {
  eventType: EventType.METER_ASSIGNED;
  data: CustomerMeterPayload;
}
