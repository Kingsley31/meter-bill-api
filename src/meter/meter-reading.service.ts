import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meterReadings } from './meter.schema';
import { and, between, count, eq, gt, inArray, lt, or, sql } from 'drizzle-orm';
import { FileService } from 'src/file/file.service';
import { TotalConsumptionResult } from './types';
import { MeterReadingUpdateService } from './meter-reading-update.service';

@Injectable()
export class MeterReadingService {
  // This service will handle all operations related to meter readings
  // such as creating, updating, deleting, and retrieving readings.

  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly fileService: FileService,
    private readonly meterReadingUpdateService: MeterReadingUpdateService,
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
          meterImage:
            reading.meterImage.trim() != 'N/A'
              ? await this.fileService.getSignedUrl(reading.meterImage)
              : '',
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

  async getReadingById(readingId: string) {
    const reading = await this.db.query.meterReadings.findFirst({
      where: eq(meterReadings.id, readingId),
    });
    return reading;
  }

  async deleteReadingById(readingId: string): Promise<boolean> {
    const result = await this.db
      .delete(meterReadings)
      .where(eq(meterReadings.id, readingId))
      .returning();
    await this.fileService.deleteFile(result[0].meterImage);
    return result.length > 0;
  }

  async getMeterCurrentReading(meterId: string) {
    const meterCurrentReading = await this.db.query.meterReadings.findFirst({
      where: eq(meterReadings.meterId, meterId),
      orderBy: (meterReadings, { desc }) => [desc(meterReadings.readingDate)],
    });
    return meterCurrentReading;
  }

  async getReadingPreviousReading(reading: typeof meterReadings.$inferSelect) {
    const previousReading = await this.db.query.meterReadings.findFirst({
      where: and(
        eq(meterReadings.meterId, reading.meterId),
        lt(meterReadings.readingDate, reading.readingDate),
      ),
      orderBy: (meterReadings, { desc }) => [desc(meterReadings.readingDate)],
    });
    return previousReading;
  }

  async getReadingNextReading(reading: typeof meterReadings.$inferSelect) {
    const nextReading = await this.db.query.meterReadings.findFirst({
      where: and(
        eq(meterReadings.meterId, reading.meterId),
        gt(meterReadings.readingDate, reading.readingDate),
      ),
      orderBy: (meterReadings, { asc }) => [asc(meterReadings.readingDate)],
    });
    return nextReading;
  }

  async updateReading({
    readingId,
    updateData,
    reading,
    reason,
    updatedBy,
  }: {
    readingId: string;
    updateData: Partial<typeof meterReadings.$inferInsert>;
    reason: string;
    updatedBy?: string;
    reading: typeof meterReadings.$inferSelect;
  }) {
    const updatedReading = await this.db
      .update(meterReadings)
      .set(updateData)
      .where(eq(meterReadings.id, readingId))
      .returning();

    if (updatedReading.length > 0 && updateData.meterImage) {
      await this.fileService.deleteFile(reading.meterImage);
    }
    // Create a log of the update
    await this.meterReadingUpdateService.createUpdate({
      meterReadingId: reading.id,
      readingDate: updatedReading[0].readingDate,
      kwhReading: updatedReading[0].kwhReading,
      kwhConsumption: updatedReading[0].kwhConsumption,
      meterImage: updatedReading[0].meterImage,
      reason: reason,
      previousKwhReading: reading.kwhReading,
      previousKwhConsumption: reading.kwhConsumption,
      previousKwhReadingDate: reading.readingDate,
      previousMeterImage: reading.meterImage,
      updatedBy: updatedBy,
    });

    return updatedReading[0];
  }
}
