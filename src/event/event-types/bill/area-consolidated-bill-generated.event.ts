import { EventType } from 'src/event/enums';
import { BaseEvent } from '../base.event';
import { BillPayload } from './bill.payload';

export class AreaConsolidatedBillGeneratedEvent extends BaseEvent<{
  areaId: string;
  bill: BillPayload;
}> {
  eventType: EventType.AREA_CONSOLIDATED_BILL_GENERATED;
  data: { areaId: string; bill: BillPayload };
}
