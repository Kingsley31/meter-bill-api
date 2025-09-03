import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConnectionOptions } from 'bullmq';
import { ProcessorDiscoveryService } from './processor-discovery.service';
import { DiscoveryModule } from '@nestjs/core';
import { IMQueue } from './im-queue';
import { BullQueue } from './bull-queue';

export enum QueueType {
  IN_MEMORY = 'in-memory',
  REDIS = 'redis',
}

export const QUEUE_MODULE_CONFIG = 'QUEUE_MODULE_CONFIG';

export type QueueModuleConfig =
  | {
      type: QueueType.IN_MEMORY;
      // in-memory doesn’t need connection
    }
  | {
      type: QueueType.REDIS;
      connection: ConnectionOptions; // required for Redis
    };

export interface QueueModuleAsyncOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<QueueModuleConfig> | QueueModuleConfig;
  inject?: any[];
}

@Module({})
export class QueueModule {
  static forRoot(config: QueueModuleConfig): DynamicModule {
    const configProvider: Provider = {
      provide: QUEUE_MODULE_CONFIG,
      useValue: config,
    };
    return {
      module: QueueModule,
      global: true,
      providers: [configProvider],
      exports: [configProvider],
    };
  }

  static forRootAsync(options: QueueModuleAsyncOptions): DynamicModule {
    const asyncProvider: Provider = {
      provide: QUEUE_MODULE_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: QueueModule,
      global: true,
      providers: [asyncProvider],
      exports: [QUEUE_MODULE_CONFIG],
    };
  }

  static registerQueue(...queueOptions: { name: string }[]): DynamicModule {
    const providers: Provider[] = queueOptions.map((queueOption) => {
      return {
        provide: queueOption.name,
        inject: [QUEUE_MODULE_CONFIG],
        useFactory: (config: QueueModuleConfig) => {
          if (config.type === QueueType.IN_MEMORY) {
            return new IMQueue(queueOption.name);
          }
          return new BullQueue(queueOption.name, {
            connection: config.connection,
          });
        },
      };
    });
    return {
      imports: [DiscoveryModule],
      module: QueueModule,
      providers: [...providers, ProcessorDiscoveryService],
      exports: [...providers, ProcessorDiscoveryService],
    };
  }
}
