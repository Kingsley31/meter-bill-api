import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meters } from './meter.schema';
import { CreateMeterDto } from './dtos/create-meter.dto';
import { MeterResponseDto } from './dtos/meter.response.dto';
import { ListMeterQueryDto } from './dtos/list-meter.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { and, eq, ilike, count, or, isNull, lt, sum, avg } from 'drizzle-orm';
import { ListUnreadMeterQueryDto } from './dtos/list-unread-meter.dto';
import { MeterType, MeterPurpose, Operaor } from './enums';
import { MeterStatsResponseDto } from './dtos/meter-stats.response.dto';
import { UpdateMeterStatusDto } from './dtos/update-meter-status.dto';
import { UpdateMeterAreaDto } from './dtos/update-meter-area.dto';

@Injectable()
export class MeterService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createMeter(createMeterDto: CreateMeterDto): Promise<MeterResponseDto> {
    const existing = await this.db.query.meters.findFirst({
      where: eq(meters.meterNumber, createMeterDto.meterNumber),
    });
    if (existing) {
      throw new BadRequestException(
        'A meter with this meterNumber already exists.',
      );
    }
    console.log(createMeterDto.calculationReferenceMeterId);
    const data = {
      ...createMeterDto,
      ctRating: String(createMeterDto.ctRating),
      ctMultiplierFactor: String(createMeterDto.ctMultiplierFactor),
      purpose: createMeterDto.purpose as string,
      type: createMeterDto.type as string,
      maxKwhReading:
        createMeterDto.maxKwhReading !== undefined &&
        createMeterDto.maxKwhReading !== null
          ? String(createMeterDto.maxKwhReading)
          : null,
      calculationReferenceMeterId:
        createMeterDto.calculationReferenceMeterId !== undefined &&
        createMeterDto.calculationReferenceMeterId !== null &&
        createMeterDto.calculationReferenceMeterId !== ''
          ? String(createMeterDto.calculationReferenceMeterId)
          : null,
    };
    // Insert the meter into the meters table
    const [meter] = await this.db.insert(meters).values(data).returning();

    // Insert sub meters if provided
    let subMeters: Array<any> | null = null;
    if (createMeterDto.subMeters && createMeterDto.subMeters.length > 0) {
      subMeters = await Promise.all(
        createMeterDto.subMeters.map(async (sub) => {
          const [subMeter] = await this.db
            .insert(schema.meterSubmeters)
            .values({
              meterId: meter.id,
              subMeterId: sub.subMeterId,
              operator: sub.operator,
            })
            .returning();
          return subMeter;
        }),
      );
    }

    // Build and return the MeterResponseDto
    return {
      ...meter,
      ctRating: meter.ctRating !== null ? Number(meter.ctRating) : null,
      ctMultiplierFactor:
        meter.ctMultiplierFactor !== null
          ? Number(meter.ctMultiplierFactor)
          : null,
      subMeters: subMeters,
    } as MeterResponseDto;
  }

  async listMeters(
    filter: ListMeterQueryDto,
  ): Promise<PaginatedResponseDto<MeterResponseDto>> {
    const { search, areaId, type, purpose, page = 1, pageSize } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    if (search) {
      where.push(
        or(
          ilike(meters.meterNumber, `%${search}%`),
          ilike(meters.customerName, `%${search}%`),
          ilike(meters.location, `%${search}%`),
        ),
      );
    }
    if (areaId) where.push(eq(meters.areaId, areaId));
    if (type) where.push(eq(meters.type, type));
    if (purpose) where.push(eq(meters.purpose, purpose));

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const meterRows = await this.db.query.meters.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset: offset,
      orderBy: (meter, { desc }) => [desc(meter.createdAt)],
      with: {
        subMeters: true, // Include subMeters in the query
      },
    });

    return {
      data: meterRows.map((meter) => ({
        ...meter,
        ctRating: meter.ctRating !== null ? Number(meter.ctRating) : 0,
        ctMultiplierFactor:
          meter.ctMultiplierFactor !== null
            ? Number(meter.ctMultiplierFactor)
            : 0,
        maxKwhReading:
          meter.maxKwhReading !== null ? Number(meter.maxKwhReading) : 0,
        currentKwhReading:
          meter.currentKwhReading !== null &&
          meter.currentKwhReading !== undefined
            ? Number(meter.currentKwhReading)
            : null,
        tariff:
          meter.tariff !== null && meter.tariff !== undefined
            ? Number(meter.tariff)
            : null,
        subMeters: (meter.subMeters ?? []).map((subMeter) => ({
          ...subMeter,
          operator: subMeter.operator as Operaor,
        })),
        purpose: meter.purpose as MeterPurpose,
        type: meter.type as MeterType,
      })),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<MeterResponseDto>;
  }

  async listUnreadMeters(
    filter: ListUnreadMeterQueryDto,
  ): Promise<PaginatedResponseDto<MeterResponseDto>> {
    const {
      search,
      areaId,
      type,
      purpose,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = filter;

    // Ensure startDate and endDate are present (should be enforced by DTO validation, but double-check)
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    if (search) {
      where.push(
        or(
          ilike(meters.meterNumber, `%${search}%`),
          ilike(meters.customerName, `%${search}%`),
          ilike(meters.location, `%${search}%`),
        ),
      );
    }
    if (areaId) where.push(eq(meters.areaId, areaId));
    if (type) where.push(eq(meters.type, type));
    if (purpose) where.push(eq(meters.purpose, purpose));

    // Only include meters that have not been read between startDate and endDate
    where.push(
      or(
        isNull(meters.currentKwhReadingDate),
        lt(meters.currentKwhReadingDate, new Date(startDate)),
        lt(meters.currentKwhReadingDate, new Date(endDate)),
      ),
    );

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const meterRows = await this.db.query.meters.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset: offset,
      orderBy: (meter, { desc }) => [desc(meter.createdAt)],
      with: {
        subMeters: true,
      },
    });

    return {
      data: meterRows.map((meter) => ({
        ...meter,
        ctRating: meter.ctRating !== null ? Number(meter.ctRating) : 0,
        ctMultiplierFactor:
          meter.ctMultiplierFactor !== null
            ? Number(meter.ctMultiplierFactor)
            : 0,
        maxKwhReading:
          meter.maxKwhReading !== null ? Number(meter.maxKwhReading) : 0,
        subMeters: (meter.subMeters ?? []).map((subMeter) => ({
          ...subMeter,
          operator: subMeter.operator as Operaor,
        })),
        purpose: meter.purpose as MeterPurpose,
        type: meter.type as MeterType,
        tariff:
          meter.tariff !== null && meter.tariff !== undefined
            ? Number(meter.tariff)
            : null,
        currentKwhReading:
          meter.currentKwhReading !== null &&
          meter.currentKwhReading !== undefined
            ? Number(meter.currentKwhReading)
            : null,
        lastBillKwhConsumption:
          meter.lastBillKwhConsumption !== null &&
          meter.lastBillKwhConsumption !== undefined
            ? Number(meter.lastBillKwhConsumption)
            : null,
      })),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    };
  }

  async getMeterStats(): Promise<MeterStatsResponseDto> {
    // Total meters
    const [{ count: totalMeters }] = await this.db
      .select({ count: count() })
      .from(meters);

    // Total active meters
    const [{ count: totalActiveMeters }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(eq(meters.isActive, true));

    // Total unread meters (currentKwhReadingDate is null)
    const [{ count: totalUnreadMeters }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(isNull(meters.currentKwhReadingDate));

    // Total energy consumed
    const [{ sum: totalEnergyConsumed }] = await this.db
      .select({ sum: sum(meters.currentKwhReading) })
      .from(meters);

    // Total energy produced (if you have a field for this, adjust accordingly)
    const [{ sum: totalEnergyProduced }] = await this.db
      .select({ sum: sum(meters.lastBillKwhConsumption) })
      .from(meters);

    // Average energy consumption
    const [{ avg: averageEnergyConsumption }] = await this.db
      .select({ avg: avg(meters.currentKwhReading) })
      .from(meters);

    // Average energy production
    const [{ avg: averageEnergyProduction }] = await this.db
      .select({ avg: avg(meters.lastBillKwhConsumption) })
      .from(meters);

    return {
      totalMeters: Number(totalMeters) || 0,
      totalActiveMeters: Number(totalActiveMeters) || 0,
      totalUnreadMeters: Number(totalUnreadMeters) || 0,
      totalEnergyConsumed: totalEnergyConsumed
        ? Number(totalEnergyConsumed)
        : 0,
      totalEnergyProduced: totalEnergyProduced
        ? Number(totalEnergyProduced)
        : 0,
      averageEnergyConsumption: averageEnergyConsumption
        ? Number(averageEnergyConsumption)
        : 0,
      averageEnergyProduction: averageEnergyProduction
        ? Number(averageEnergyProduction)
        : 0,
    };
  }

  async getMeterById(params: { meterId: string }): Promise<MeterResponseDto> {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, params.meterId),
      with: {
        subMeters: true,
      },
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    return {
      ...meter,
      ctRating: meter.ctRating !== null ? Number(meter.ctRating) : 0,
      ctMultiplierFactor:
        meter.ctMultiplierFactor !== null
          ? Number(meter.ctMultiplierFactor)
          : 0,
      maxKwhReading:
        meter.maxKwhReading !== null ? Number(meter.maxKwhReading) : 0,
      subMeters: (meter.subMeters ?? []).map((subMeter) => ({
        ...subMeter,
        operator: subMeter.operator as Operaor,
      })),
      purpose: meter.purpose as MeterPurpose,
      type: meter.type as MeterType,
      tariff:
        meter.tariff !== null && meter.tariff !== undefined
          ? Number(meter.tariff)
          : null,
      currentKwhReading:
        meter.currentKwhReading !== null &&
        meter.currentKwhReading !== undefined
          ? Number(meter.currentKwhReading)
          : null,
      lastBillKwhConsumption:
        meter.lastBillKwhConsumption !== null &&
        meter.lastBillKwhConsumption !== undefined
          ? Number(meter.lastBillKwhConsumption)
          : null,
    } as MeterResponseDto;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateMeterStatusDto,
  ): Promise<boolean> {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
      with: {
        subMeters: true,
      },
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    await this.db
      .update(meters)
      .set({
        isActive: updateStatusDto.isActive,
      })
      .where(eq(meters.id, id));
    return true;
  }

  async updateArea(id: string, updateMeterAreaDto: UpdateMeterAreaDto) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
      with: {
        subMeters: true,
      },
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    await this.db
      .update(meters)
      .set({
        areaId: updateMeterAreaDto.areaId,
        areaName: updateMeterAreaDto.areaName,
        location: updateMeterAreaDto.location,
      })
      .where(eq(meters.id, id));
    return true;
  }
}
