import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from './enums';
import { BaseEvent } from './event-types/base.event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService {
  constructor(private eventEmitter: EventEmitter2) {}

  publish<T>(eventType: EventType, event: BaseEvent<T>) {
    this.eventEmitter.emit(eventType, event);
  }
}
