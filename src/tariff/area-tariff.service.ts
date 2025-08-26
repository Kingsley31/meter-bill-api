import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { areaTariffs } from './tariff.schema';
import { and, between, count, eq, lte } from 'drizzle-orm';
import { CreateAreaTariffDto } from './dto/create-area-tariff.dto';

@Injectable()
export class AreaTariffService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async checkTariffAlreadyExist(createAreaTariffDto: CreateAreaTariffDto) {
    const tariffExist = await this.db.query.areaTariffs.findFirst({
      where: and(
        eq(areaTariffs.areaId, createAreaTariffDto.areaId),
        eq(areaTariffs.effectiveFrom, createAreaTariffDto.effectiveFrom),
      ),
    });
    return tariffExist;
  }

  async createTariff(params: {
    areaId: string;
    areaName: string;
    tariff: number;
    effectiveFrom: Date;
    endDate: Date;
  }) {
    const areaTariff = await this.db
      .insert(areaTariffs)
      .values({
        areaId: params.areaId,
        areaName: params.areaName,
        tariff: params.tariff.toString(),
        effectiveFrom: params.effectiveFrom,
        endDate: params.endDate,
      })
      .returning();
    return areaTariff[0];
  }

  async getLastTariffForArea(params: { areaId: string }) {
    const whereConditions = [eq(areaTariffs.areaId, params.areaId)];
    const lastAreaTariff = await this.db.query.areaTariffs.findFirst({
      where: and(...whereConditions),
      orderBy: (areaTariffs, { desc }) => desc(areaTariffs.effectiveFrom),
    });

    return lastAreaTariff;
  }

  async getAreaCurrentDateTariff(params: {
    areaId: string;
    currentDate: Date;
  }) {
    const areaActiveTariffForDate = await this.db.query.areaTariffs.findFirst({
      where: and(
        eq(areaTariffs.areaId, params.areaId),
        lte(areaTariffs.effectiveFrom, params.currentDate),
      ),
      orderBy: (areaTariffs, { desc }) => desc(areaTariffs.effectiveFrom),
    });
    return areaActiveTariffForDate;
  }

  async updateAreaTariffEndDate(params: { tariffId: string; endDate: Date }) {
    const areaTariff = await this.db.query.areaTariffs.findFirst({
      where: eq(areaTariffs.id, params.tariffId),
    });
    if (!areaTariff)
      throw new BadRequestException(
        `Area Tariff with ID: ${params.tariffId} not found.`,
      );
    const result = await this.db
      .update(areaTariffs)
      .set({
        endDate: params.endDate,
      })
      .where(eq(areaTariffs.id, params.tariffId))
      .returning();
    return result[0];
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
