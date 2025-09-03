import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, QueueOptions } from 'bullmq';

@Injectable()
export class BullQueue
  extends Queue
  implements OnModuleDestroy, OnApplicationShutdown
{
  constructor(name: string, options: QueueOptions) {
    super(name, options);
  }

  async onModuleDestroy() {
    await this.close();
  }

  async onApplicationShutdown(signal?: string) {
    await this.close();
    console.log(`Application shutting down due to ${signal}`);
  }
}
