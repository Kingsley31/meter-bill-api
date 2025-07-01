import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meters } from './meter.schema';
import { CreateMeterDto } from './dtos/create-meter.dto';
import { MeterResponseDto } from './dtos/meter.response.dto';
import { ListMeterQueryDto } from './dtos/list-meter.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { and, eq, ilike, count } from 'drizzle-orm';

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
    const {
      search,
      areaId,
      type,
      purpose,
      meterNumber,
      customerId,
      customerName,
      page = 1,
      pageSize,
    } = filter;

    const where: Array<ReturnType<typeof eq>> = [];

    if (search) {
      where.push(ilike(meters.meterNumber, `%${search}%`));
    }
    if (areaId) where.push(eq(meters.areaId, areaId));
    if (type) where.push(eq(meters.type, type));
    if (purpose) where.push(eq(meters.purpose, purpose));
    if (meterNumber) where.push(eq(meters.meterNumber, meterNumber));
    if (customerId) where.push(eq(meters.customerId, customerId));
    if (customerName)
      where.push(ilike(meters.customerName, `%${customerName}%`));

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
        ctRating: meter.ctRating !== null ? Number(meter.ctRating) : null,
        ctMultiplierFactor:
          meter.ctMultiplierFactor !== null
            ? Number(meter.ctMultiplierFactor)
            : null,
        maxKwhReading:
          meter.maxKwhReading !== null ? Number(meter.maxKwhReading) : null,
        subMeters: meter.subMeters ?? [],
      })),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<MeterResponseDto>;
  }
}
