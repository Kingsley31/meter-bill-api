import { Job } from 'bullmq';

export interface Processor {
  handle(job: Job): Promise<void>;
}
