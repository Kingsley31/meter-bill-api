import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from './enums';
import { BaseEvent } from './event-types/base.event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService {
  constructor(private eventEmitter: EventEmitter2) {}

  publish(eventType: EventType, event: BaseEvent) {
    this.eventEmitter.emit(eventType, event);
  }
}
