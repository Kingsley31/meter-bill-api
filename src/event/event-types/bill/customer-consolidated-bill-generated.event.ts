import { EventType } from 'src/event/enums';
import { BaseEvent } from '../base.event';
import { BillPayload } from './bill.payload';

export class CustomerConsolidatedBillGeneratedEvent extends BaseEvent<{
  meterIds: string[];
  customerId: string;
  bill: BillPayload;
}> {
  eventType: EventType.CUSTOMER_CONSOLIDATED_BILL_GENERATED;
  data: { customerId: string; meterIds: string[]; bill: BillPayload };
}
