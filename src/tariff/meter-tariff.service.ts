import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterTariffs } from './tariff.schema';
import { and, between, count, eq, lt, lte } from 'drizzle-orm';
import { CreateMeterTariffDto } from './dto/create-meter-tariff.dto';

@Injectable()
export class MeterTariffService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async checkTariffAlreadyExist(
    createMeterTariffDto: CreateMeterTariffDto & { meterId: string },
  ) {
    const tariffExist = await this.db.query.meterTariffs.findFirst({
      where: and(
        eq(meterTariffs.areaId, createMeterTariffDto.areaId),
        eq(meterTariffs.meterId, createMeterTariffDto.meterId),
        eq(meterTariffs.effectiveFrom, createMeterTariffDto.effectiveFrom),
      ),
    });
    return tariffExist;
  }

  async createTariff(params: {
    meterId: string;
    meterNumber: string;
    areaId: string;
    tariff: number;
    effectiveFrom: Date;
    endDate: Date;
  }) {
    const meterTariff = await this.db
      .insert(meterTariffs)
      .values({
        meterId: params.meterId,
        meterNumber: params.meterNumber,
        areaId: params.areaId,
        tariff: params.tariff.toString(),
        effectiveFrom: params.effectiveFrom,
        endDate: params.endDate,
      })
      .returning();
    return meterTariff[0];
  }

  async getLastTariffForMeter(params: { meterId: string }) {
    const whereConditions = [eq(meterTariffs.meterId, params.meterId)];
    const lastMeterTariff = await this.db.query.meterTariffs.findFirst({
      where: and(...whereConditions),
      orderBy: (meterTariffs, { desc }) => desc(meterTariffs.effectiveFrom),
    });

    return lastMeterTariff;
  }

  async updateMeterTariffEndDate(params: { tariffId: string; endDate: Date }) {
    const meterTariff = await this.db.query.meterTariffs.findFirst({
      where: eq(meterTariffs.id, params.tariffId),
    });
    if (!meterTariff)
      throw new BadRequestException(
        `Meter Tariff with ID: ${params.tariffId} not found.`,
      );
    const result = await this.db
      .update(meterTariffs)
      .set({
        endDate: params.endDate,
      })
      .where(eq(meterTariffs.id, params.tariffId))
      .returning();
    return result[0];
  }

  async getMeterTariffPreviousTariff(params: {
    meterId: string;
    effectiveFrom: Date;
  }) {
    const previousTariff = await this.db.query.meterTariffs.findFirst({
      where: and(
        lt(meterTariffs.effectiveFrom, params.effectiveFrom),
        eq(meterTariffs.meterId, params.meterId),
      ),
      orderBy: (tariffs, { desc }) => desc(tariffs.effectiveFrom),
    });
    return previousTariff;
  }

  async getActiveMeterTariffByDate(params: { meterId: string; date: Date }) {
    const activeTariff = await this.db.query.meterTariffs.findFirst({
      where: and(
        lte(meterTariffs.effectiveFrom, params.date),
        eq(meterTariffs.meterId, params.meterId),
      ),
      orderBy: (tariffs, { desc }) => desc(tariffs.effectiveFrom),
    });
    return activeTariff;
  }

  async meterHasTariffs(meterId: string) {
    const tariffExistForMeter = await this.db.query.meterTariffs.findFirst({
      where: eq(meterTariffs.meterId, meterId),
    });
    if (!tariffExistForMeter) return false;
    return true;
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
