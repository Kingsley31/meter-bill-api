import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { areaLeaders, areas } from './area.schema';
import { and, eq, isNotNull } from 'drizzle-orm';

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

  async areaHasBankDetails(areaId: string) {
    const area = await this.db.query.areas.findFirst({
      where: and(isNotNull(areas.bankAccountNumber), eq(areas.id, areaId)),
    });
    return !!area;
  }

  async getAreaBankDetails(areaId: string): Promise<{
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bankCode: string;
  }> {
    const area = await this.db.query.areas.findFirst({
      where: and(isNotNull(areas.bankAccountNumber), eq(areas.id, areaId)),
      columns: {
        bankAccountName: true,
        bankAccountNumber: true,
        bankName: true,
        bankCode: true,
      },
    });
    if (!area) {
      throw new Error('Area bank details not found');
    }
    return {
      bankAccountName: area.bankAccountName!,
      bankAccountNumber: area.bankAccountNumber!,
      bankName: area.bankName!,
      bankCode: area.bankCode!,
    };
  }
}
