import { applyDecorators } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

export function Subscribe(eventType: string) {
  return applyDecorators(OnEvent(eventType, { async: true }));
}
