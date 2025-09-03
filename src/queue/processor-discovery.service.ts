import {
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, ModuleRef } from '@nestjs/core';
import { ProcessQueue } from './queue-processor.decorator';
import { Job, Worker } from 'bullmq';
import { IMQueue } from './im-queue';
import { Processor } from './processor';
import {
  QUEUE_MODULE_CONFIG,
  QueueModuleConfig,
  QueueType,
} from './queue.module';
import { BullQueue } from './bull-queue';

@Injectable()
export class ProcessorDiscoveryService
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  intervalIds: NodeJS.Timeout[] = [];
  private workers: Worker[] = [];
  constructor(
    private readonly discovery: DiscoveryService,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const queueName = this.discovery.getMetadataByDecorator(
        ProcessQueue,
        wrapper,
      ) as string | null;

      if (queueName) {
        const processor: Processor = wrapper.instance as Processor;
        try {
          const queue: BullQueue | IMQueue = this.moduleRef.get(queueName);
          if (queue instanceof IMQueue) {
            queue.registerProcessor(processor);
            this.intervalIds.push(queue.startEmittingJobs());
          } else {
            const config: QueueModuleConfig =
              this.moduleRef.get(QUEUE_MODULE_CONFIG);
            if (config.type == QueueType.REDIS) {
              const worker = new Worker(
                queueName,
                async (job: Job) => await processor.handle(job),
                { connection: config.connection },
              );
              this.workers.push(worker);
            }
          }
        } catch (e) {
          console.error(
            `[ProcessorDiscoveryService] Failed to register ${queueName}:`,
            e,
          );
        }
      }
    }
  }

  private async cleanup() {
    for (const intervalId of this.intervalIds) {
      clearInterval(intervalId);
    }
    for (const worker of this.workers) {
      await worker.close();
    }
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async onApplicationShutdown(signal?: string) {
    await this.cleanup();
    console.log(`Application shutting down due to ${signal}`);
  }
}
