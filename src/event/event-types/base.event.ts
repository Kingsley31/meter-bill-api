import { EventType } from '../enums';

export class BaseEvent<T> {
  eventType: EventType;
  data: unknown;

  constructor(eventType: EventType, data: T) {
    this.eventType = eventType;
    this.data = data;
  }
}
