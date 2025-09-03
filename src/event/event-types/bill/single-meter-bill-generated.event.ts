import { EventType } from 'src/event/enums';
import { BaseEvent } from '../base.event';
import { BillPayload } from './bill.payload';

export class SingleMeterBillGeneratedEvent extends BaseEvent<{
  meterId: string;
  bill: BillPayload;
}> {
  eventType: EventType.SINGLE_METER_BILL_GENERATED;
  data: { meterId: string; bill: BillPayload };
}
