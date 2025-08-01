import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterReadingUpdates } from './meter.schema';

@Injectable()
export class MeterReadingUpdateService {
  // This service will handle operations related to meter reading updates,
  // such as creating, and retrieving updates for meter readings.

  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createUpdate(params: typeof meterReadingUpdates.$inferInsert) {
    const meterReadingUpdate = await this.db
      .insert(meterReadingUpdates)
      .values(params)
      .returning();
    return meterReadingUpdate;
  }
}
