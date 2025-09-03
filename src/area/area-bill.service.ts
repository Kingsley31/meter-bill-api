import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { areaLeaders } from './area.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AreaBillService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getAreaLeaders(areaId: string) {
    const areaLeaderRows = await this.db.query.areaLeaders.findMany({
      where: eq(areaLeaders.areaId, areaId),
    });
    return areaLeaderRows;
  }
}
