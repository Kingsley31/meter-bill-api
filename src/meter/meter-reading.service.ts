import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterReadings } from './meter.schema';
import { and, between, count, eq, inArray, or, sql } from 'drizzle-orm';
import { FileService } from 'src/file/file.service';
import { TotalConsumptionResult } from './types';

@Injectable()
export class MeterReadingService {
  // This service will handle all operations related to meter readings
  // such as creating, updating, deleting, and retrieving readings.

  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly fileService: FileService,
  ) {}

  // Define methods for CRUD operations on meter readings
  async createReading(params: {
    meterId: string;
    meterNumber: string;
    readingDate: Date;
    kwhReading: number;
    kwhConsumption: number;
    meterImage: string;
  }) {
    const createdReading = await this.db
      .insert(meterReadings)
      .values({
        ...params,
        kwhReading: String(params.kwhReading),
        kwhConsumption: String(params.kwhConsumption),
      })
      .returning();
    return createdReading;
  }

  async getReadingsByMeterId(
    meterId: string,
    filter: {
      readingStartDate?: Date;
      readingEndDate?: Date;
      createdAtStart?: Date;
      createdAtEnd?: Date;
      page?: number;
      pageSize?: number;
    },
  ) {
    const {
      readingStartDate,
      readingEndDate,
      createdAtStart,
      createdAtEnd,
      page = 1,
      pageSize = 20,
    } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    where.push(eq(meterReadings.meterId, meterId));

    if (readingStartDate && readingEndDate) {
      where.push(
        between(meterReadings.readingDate, readingStartDate, readingEndDate),
      );
    }

    if (createdAtStart && createdAtEnd) {
      where.push(
        between(meterReadings.createdAt, createdAtStart, createdAtEnd),
      );
    }

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(meterReadings)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const meterReadingRows = await this.db.query.meterReadings.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset: offset,
      orderBy: (meterReadings, { desc }) => [desc(meterReadings.readingDate)],
    });
    const records = await Promise.all(
      meterReadingRows.map(async (reading) => {
        return {
          ...reading,
          meterImage: await this.fileService.getSignedUrl(reading.meterImage),
        };
      }),
    );
    return {
      data: records,
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    };
  }

  async getTotalConsumptionForMeters(
    meterIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<TotalConsumptionResult[]> {
    const result = await this.db
      .select({
        meterId: meterReadings.meterId,
        totalConsumption: sql<string>`SUM(${meterReadings.kwhConsumption})`,
      })
      .from(meterReadings)
      .where(
        and(
          inArray(meterReadings.meterId, meterIds),
          between(meterReadings.readingDate, startDate, endDate),
        ),
      )
      .groupBy(meterReadings.meterId);

    return result;
  }

  async getConsumptionForMeterByRange(params: {
    meterId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    const result = await this.db
      .select({
        totalConsumption: sql<string>`SUM(${meterReadings.kwhConsumption})`,
      })
      .from(meterReadings)
      .where(
        and(
          eq(meterReadings.meterId, params.meterId),
          between(meterReadings.readingDate, params.startDate, params.endDate),
        ),
      );

    return Number(result.length > 0 ? result[0].totalConsumption : 0);
  }
}
