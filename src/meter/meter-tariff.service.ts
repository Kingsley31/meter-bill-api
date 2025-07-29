import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterTariffs } from './meter.schema';
import { and, between, count, eq, lte } from 'drizzle-orm';

@Injectable()
export class MeterTariffService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createTariff(params: {
    meterId: string;
    meterNumber: string;
    tariff: number;
    effectiveFrom: Date;
  }) {
    const meterTariff = await this.db
      .insert(meterTariffs)
      .values({
        meterId: params.meterId,
        meterNumber: params.meterNumber,
        tariff: params.tariff.toString(),
        effectiveFrom: params.effectiveFrom,
      })
      .returning();
    return meterTariff;
  }

  async getLastTariffForMeter(params: {
    meterId: string;
    tariff?: string | null;
  }) {
    const whereConditions = [eq(meterTariffs.meterId, params.meterId)];
    if (params.tariff) {
      whereConditions.push(eq(meterTariffs.tariff, params.tariff));
    }
    const lastMeterTariff = await this.db.query.meterTariffs.findMany({
      where: and(...whereConditions),
      orderBy: (meterTariffs, { desc }) => desc(meterTariffs.effectiveFrom),
    });

    return lastMeterTariff.length ? lastMeterTariff[0] : null;
  }

  async getMeterCurrentDateTariff(params: {
    meterId: string;
    currentDate: Date;
  }) {
    const potentialTariffs = await this.db.query.meterTariffs.findMany({
      where: and(
        eq(meterTariffs.meterId, params.meterId),
        lte(meterTariffs.effectiveFrom, params.currentDate),
      ),
      limit: 1,
      orderBy: (meterTariffs, { desc }) => desc(meterTariffs.effectiveFrom),
    });
    if (potentialTariffs.length === 0) {
      return null;
    }
    return potentialTariffs[0];
  }

  async getTariffsByMeterId(
    meterId: string,
    filter: {
      tariff?: number;
      effectiveFromStart?: Date;
      effectiveFromEnd?: Date;
      page: number;
      pageSize: number;
    },
  ) {
    const {
      tariff,
      effectiveFromStart,
      effectiveFromEnd,
      page = 1,
      pageSize = 20,
    } = filter;
    const where: Array<ReturnType<typeof eq>> = [
      eq(meterTariffs.meterId, meterId),
    ];
    if (tariff) {
      where.push(eq(meterTariffs.tariff, tariff.toString()));
    }
    if (effectiveFromStart && effectiveFromEnd) {
      where.push(
        between(
          meterTariffs.effectiveFrom,
          effectiveFromStart,
          effectiveFromEnd,
        ),
      );
    }
    const offset = (page - 1) * pageSize;
    const meterTariffRows = await this.db.query.meterTariffs.findMany({
      where: and(...where),
      limit: pageSize,
      offset: offset,
      orderBy: (meterTariffs, { desc }) => desc(meterTariffs.effectiveFrom),
    });
    const totalCount = await this.db
      .select({ count: count() })
      .from(meterTariffs)
      .where(where.length ? and(...where) : undefined);
    return {
      data: meterTariffRows.map((meterTariff) => ({
        ...meterTariff,
        tariff: Number(meterTariff.tariff),
      })),
      total: totalCount[0].count,
      page,
      pageSize,
      hasMore: totalCount[0].count > page * pageSize,
    };
  }
}
