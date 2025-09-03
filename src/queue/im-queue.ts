import { Job, JobsOptions } from 'bullmq';
import { Processor } from './processor';
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { InMemoryJob } from './im-job';

@Injectable()
export class IMQueue implements OnModuleDestroy, OnApplicationShutdown {
  processors: Processor[] = [];
  jobs: Job[] = [];
  logger: Logger;

  constructor(public readonly name: string) {}

  add<DataType>(
    name: string,
    data: DataType,
    opts?: JobsOptions,
  ): Promise<Job<DataType, any, string>> {
    const job = new InMemoryJob<DataType>(
      (this.jobs.length + 1).toString(),
      name,
      data,
      opts,
    );
    const length = this.jobs.push(job as Job<DataType, any, string>);
    const newJob = this.jobs[length - 1];
    return Promise.resolve(newJob as Job<DataType, any, string>);
  }

  registerProcessor(processor: Processor) {
    this.processors.push(processor);
  }

  startEmittingJobs() {
    return setInterval(() => this.emitJobs(), 3000);
  }

  emitJobs() {
    if (this.processors.length == 0 || this.jobs.length == 0) return;
    const firstJob = this.jobs.shift();
    this.processors[0].handle(firstJob as Job).catch((e) => {
      if (this.logger) this.logger.error(e);
    });
  }

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  async close() {}

  async onModuleDestroy() {
    await this.close();
  }

  async onApplicationShutdown(signal?: string) {
    await this.close();
    console.log(`Application shutting down due to ${signal}`);
  }
}
