import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { areaTariffs } from './area.schema';
import { and, between, count, eq, lte } from 'drizzle-orm';

@Injectable()
export class AreaTariffService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createTariff(params: {
    areaId: string;
    areaName: string;
    tariff: number;
    effectiveFrom: Date;
  }) {
    const areaTariff = await this.db
      .insert(areaTariffs)
      .values({
        areaId: params.areaId,
        areaName: params.areaName,
        tariff: params.tariff.toString(),
        effectiveFrom: params.effectiveFrom,
      })
      .returning();
    return areaTariff;
  }

  async getLastTariffForArea(params: {
    areaId: string;
    tariff?: string | null;
  }) {
    const whereConditions = [eq(areaTariffs.areaId, params.areaId)];
    if (params.tariff) {
      whereConditions.push(eq(areaTariffs.tariff, params.tariff));
    }
    const lastAreaTariff = await this.db.query.areaTariffs.findMany({
      where: and(...whereConditions),
      orderBy: (areaTariffs, { desc }) => desc(areaTariffs.effectiveFrom),
    });

    return lastAreaTariff.length ? lastAreaTariff[0] : null;
  }

  async getAreaCurrentDateTariff(params: {
    areaId: string;
    currentDate: Date;
  }) {
    const potentialTariffs = await this.db.query.areaTariffs.findMany({
      where: and(
        eq(areaTariffs.areaId, params.areaId),
        lte(areaTariffs.effectiveFrom, params.currentDate),
      ),
      limit: 1,
      orderBy: (areaTariffs, { desc }) => desc(areaTariffs.effectiveFrom),
    });
    if (potentialTariffs.length === 0) {
      return null;
    }
    return potentialTariffs[0];
  }

  async getTariffsByAreaId(
    areaId: string,
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
      eq(areaTariffs.areaId, areaId),
    ];
    if (tariff) {
      where.push(eq(areaTariffs.tariff, tariff.toString()));
    }
    if (effectiveFromStart && effectiveFromEnd) {
      where.push(
        between(
          areaTariffs.effectiveFrom,
          effectiveFromStart,
          effectiveFromEnd,
        ),
      );
    }
    const offset = (page - 1) * pageSize;
    const areaTariffRows = await this.db.query.areaTariffs.findMany({
      where: and(...where),
      limit: pageSize,
      offset: offset,
      orderBy: (areaTariffs, { desc }) => desc(areaTariffs.effectiveFrom),
    });
    const totalCount = await this.db
      .select({ count: count() })
      .from(areaTariffs)
      .where(where.length ? and(...where) : undefined);
    return {
      data: areaTariffRows.map((areaTariff) => ({
        ...areaTariff,
        tariff: Number(areaTariff.tariff),
      })),
      total: totalCount[0].count,
      page,
      pageSize,
      hasMore: totalCount[0].count > page * pageSize,
    };
  }
}
