import { EventType } from '../enums';

export class BaseEvent {
  eventType: EventType;
  data: unknown;

  constructor(eventType: EventType, data: unknown) {
    this.eventType = eventType;
    this.data = data;
  }
}
