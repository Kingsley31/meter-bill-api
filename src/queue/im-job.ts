import { JobsOptions } from 'bullmq';

export class FakeQueue {
  constructor(public name: string) {}

  opts = { connection: {} };

  toKey(type: string) {
    return `${this.name}:${type}`;
  }
}

export class InMemoryJob<DataType = any> {
  constructor(
    public id: string,
    public name: string,
    public data: DataType,
    public opts?: JobsOptions,
  ) {}

  // mimic BullMQ Job methods you actually need
  async progress(): Promise<number> {
    return Promise.resolve(100);
  }
}
