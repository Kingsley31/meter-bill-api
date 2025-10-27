import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterReadings, meters } from './meter.schema';
import { and, between, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';

@Injectable()
export class MeterBillService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async areaMeterReadingsForPeiodIsMissingTariff(params: {
    areaId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const result = await this.db
      .select()
      .from(meterReadings)
      .innerJoin(meters, eq(meterReadings.meterId, meters.id))
      .where(
        and(
          eq(meters.areaId, params.areaId),
          between(meterReadings.readingDate, params.startDate, params.endDate),
          isNull(meterReadings.tariff),
        ),
      );
    return result.length > 0;
  }

  async customerMeterReadingsForPeiodIsMissingTariff(params: {
    meterIds: string[];
    startDate: Date;
    endDate: Date;
  }) {
    const result = await this.db
      .select()
      .from(meterReadings)
      .where(
        and(
          inArray(meterReadings.meterId, params.meterIds),
          between(meterReadings.readingDate, params.startDate, params.endDate),
          isNull(meterReadings.tariff),
        ),
      );
    return result.length > 0;
  }

  async getAreaMeters(params: {
    areaId: string;
    batchSize?: number;
    offset: number;
  }) {
    const { areaId, offset, batchSize = 1000 } = params;
    const retrievedMeters = await this.db.query.meters.findMany({
      where: eq(meters.areaId, areaId),
      limit: batchSize,
      offset,
    });
    return retrievedMeters;
  }

  async getMeterBillBreakdownsForPeriod(params: {
    meterId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const readingsWithWindow = this.db.$with('readings_with_window').as(
      this.db
        .select({
          meterId: meterReadings.meterId,
          tariffId: meterReadings.tariffId,
          areaId: meters.areaId,
          areaName: meters.areaName,
          location: meters.location,
          meterNumber: meters.meterNumber,
          amount: meterReadings.amount,
          kwhConsumption: meterReadings.kwhConsumption,
          tariff: meterReadings.tariff,
          readingDate: meterReadings.readingDate,
          firstReadKwh:
            sql<number>`FIRST_VALUE(${meterReadings.prevKwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadKwh'),
          firstReadDate:
            sql<Date>`FIRST_VALUE(${meterReadings.readingDate}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadDate'),
          initialReadKwh: sql<number>`
        COALESCE(
          LAG(${meterReadings.kwhReading}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          0
        )
      `.as('initialReadKwh'),
          initialReadDate: sql<Date>`
        COALESCE(
          LAG(${meterReadings.readingDate}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          ${meterReadings.readingDate}
        )
      `.as('initialReadDate'),
          lastReadKwh:
            sql<number>`LAST_VALUE(${meterReadings.kwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )`.as('lastReadKwh'),
        })
        .from(meterReadings)
        .innerJoin(meters, eq(meterReadings.meterId, meters.id))
        .where(
          and(
            eq(meterReadings.meterId, params.meterId),
            lte(meterReadings.readingDate, params.endDate),
          ),
        ),
    );

    const results = await this.db
      .with(readingsWithWindow)
      .select({
        meterId: readingsWithWindow.meterId,
        tariffId: readingsWithWindow.tariffId,
        areaId: readingsWithWindow.areaId,
        areaName: readingsWithWindow.areaName,
        location: readingsWithWindow.location,
        meterNumber: readingsWithWindow.meterNumber,
        totalAmount: sql<number>`SUM(${readingsWithWindow.amount})`,
        totalConsumption: sql<number>`SUM(${readingsWithWindow.kwhConsumption})`,
        tariff: sql<number>`MAX(${readingsWithWindow.tariff})`,
        initialReadKwh: sql<number>`MAX(${readingsWithWindow.initialReadKwh})`,
        initialReadDate: sql<Date>`MAX(${readingsWithWindow.initialReadDate})`,
        firstReadKwh: sql<number>`MAX(${readingsWithWindow.firstReadKwh})`,
        firstReadDate: sql<Date>`MAX(${readingsWithWindow.firstReadDate})`,
        lastReadKwh: sql<number>`MAX(${readingsWithWindow.lastReadKwh})`,
        lastReadDate: sql<Date>`MAX(${readingsWithWindow.readingDate})`,
      })
      .from(readingsWithWindow)
      .groupBy(
        readingsWithWindow.meterId,
        readingsWithWindow.tariffId,
        readingsWithWindow.areaId,
        readingsWithWindow.areaName,
        readingsWithWindow.location,
        readingsWithWindow.meterNumber,
      )
      .where(gte(readingsWithWindow.readingDate, params.startDate));
    return results;
  }

  async getAreaConsolidatedBillBreakdownsForPeriod(params: {
    areaId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const readingsWithWindow = this.db.$with('readings_with_window').as(
      this.db
        .select({
          meterId: meterReadings.meterId,
          tariffId: meterReadings.tariffId,
          areaId: meters.areaId,
          areaName: meters.areaName,
          location: meters.location,
          meterNumber: meters.meterNumber,
          amount: meterReadings.amount,
          kwhConsumption: meterReadings.kwhConsumption,
          tariff: meterReadings.tariff,
          readingDate: meterReadings.readingDate,
          initialReadKwh: sql<number>`
        COALESCE(
          LAG(${meterReadings.kwhReading}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          0
        )
      `.as('initialReadKwh'),

          initialReadDate: sql<Date>`
        COALESCE(
          LAG(${meterReadings.readingDate}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          ${meterReadings.readingDate}
        )
      `.as('initialReadDate'),
          firstReadKwh:
            sql<number>`FIRST_VALUE(${meterReadings.prevKwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadKwh'),
          firstReadDate:
            sql<Date>`FIRST_VALUE(${meterReadings.readingDate}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadDate'),
          lastReadKwh:
            sql<number>`LAST_VALUE(${meterReadings.kwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )`.as('lastReadKwh'),
        })
        .from(meterReadings)
        .innerJoin(meters, eq(meterReadings.meterId, meters.id))
        .where(
          and(
            eq(meters.areaId, params.areaId),
            lte(meterReadings.readingDate, params.endDate),
          ),
        ),
    );

    const results = await this.db
      .with(readingsWithWindow)
      .select({
        meterId: readingsWithWindow.meterId,
        tariffId: readingsWithWindow.tariffId,
        areaId: readingsWithWindow.areaId,
        areaName: readingsWithWindow.areaName,
        location: readingsWithWindow.location,
        meterNumber: readingsWithWindow.meterNumber,
        totalAmount: sql<number>`SUM(${readingsWithWindow.amount})`,
        totalConsumption: sql<number>`SUM(${readingsWithWindow.kwhConsumption})`,
        tariff: sql<number>`MAX(${readingsWithWindow.tariff})`,
        initialReadKwh: sql<number>`MAX(${readingsWithWindow.initialReadKwh})`,
        initialReadDate: sql<Date>`MAX(${readingsWithWindow.initialReadDate})`,
        firstReadKwh: sql<number>`MAX(${readingsWithWindow.firstReadKwh})`,
        firstReadDate: sql<Date>`MAX(${readingsWithWindow.firstReadDate})`,
        lastReadKwh: sql<number>`MAX(${readingsWithWindow.lastReadKwh})`,
        lastReadDate: sql<Date>`MAX(${readingsWithWindow.readingDate})`,
      })
      .from(readingsWithWindow)
      .groupBy(
        readingsWithWindow.meterId,
        readingsWithWindow.tariffId,
        readingsWithWindow.areaId,
        readingsWithWindow.areaName,
        readingsWithWindow.location,
        readingsWithWindow.meterNumber,
      )
      .where(gte(readingsWithWindow.readingDate, params.startDate));
    return results;
  }

  async getCustomerConsolidatedBillBreakdownsForPeriod(params: {
    meterIds: string[];
    startDate: Date;
    endDate: Date;
  }) {
    const readingsWithWindow = this.db.$with('readings_with_window').as(
      this.db
        .select({
          meterId: meterReadings.meterId,
          tariffId: meterReadings.tariffId,
          areaId: meters.areaId,
          areaName: meters.areaName,
          location: meters.location,
          meterNumber: meters.meterNumber,
          amount: meterReadings.amount,
          kwhConsumption: meterReadings.kwhConsumption,
          tariff: meterReadings.tariff,
          readingDate: meterReadings.readingDate,
          initialReadKwh: sql<number>`
        COALESCE(
          LAG(${meterReadings.kwhReading}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          0
        )
      `.as('initialReadKwh'),

          initialReadDate: sql<Date>`
        COALESCE(
          LAG(${meterReadings.readingDate}) OVER (
            PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
            ORDER BY ${meterReadings.readingDate} ASC
          ),
          ${meterReadings.readingDate}
        )
      `.as('initialReadDate'),
          firstReadKwh:
            sql<number>`FIRST_VALUE(${meterReadings.prevKwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadKwh'),
          firstReadDate:
            sql<Date>`FIRST_VALUE(${meterReadings.readingDate}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
    )`.as('firstReadDate'),
          lastReadKwh:
            sql<number>`LAST_VALUE(${meterReadings.kwhReading}) OVER (
      PARTITION BY ${meterReadings.meterId}, ${meterReadings.tariffId}
      ORDER BY ${meterReadings.readingDate} ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )`.as('lastReadKwh'),
        })
        .from(meterReadings)
        .innerJoin(meters, eq(meterReadings.meterId, meters.id))
        .where(
          and(
            inArray(meters.id, params.meterIds),
            lte(meterReadings.readingDate, params.endDate),
          ),
        ),
    );

    const results = await this.db
      .with(readingsWithWindow)
      .select({
        meterId: readingsWithWindow.meterId,
        tariffId: readingsWithWindow.tariffId,
        areaId: readingsWithWindow.areaId,
        areaName: readingsWithWindow.areaName,
        location: readingsWithWindow.location,
        meterNumber: readingsWithWindow.meterNumber,
        totalAmount: sql<number>`SUM(${readingsWithWindow.amount})`,
        totalConsumption: sql<number>`SUM(${readingsWithWindow.kwhConsumption})`,
        tariff: sql<number>`MAX(${readingsWithWindow.tariff})`,
        initialReadKwh: sql<number>`MAX(${readingsWithWindow.initialReadKwh})`,
        initialReadDate: sql<Date>`MAX(${readingsWithWindow.initialReadDate})`,
        firstReadKwh: sql<number>`MAX(${readingsWithWindow.firstReadKwh})`,
        firstReadDate: sql<Date>`MAX(${readingsWithWindow.firstReadDate})`,
        lastReadKwh: sql<number>`MAX(${readingsWithWindow.lastReadKwh})`,
        lastReadDate: sql<Date>`MAX(${readingsWithWindow.readingDate})`,
      })
      .from(readingsWithWindow)
      .groupBy(
        readingsWithWindow.meterId,
        readingsWithWindow.tariffId,
        readingsWithWindow.areaId,
        readingsWithWindow.areaName,
        readingsWithWindow.location,
        readingsWithWindow.meterNumber,
      )
      .where(gte(readingsWithWindow.readingDate, params.startDate));
    return results;
  }
}
