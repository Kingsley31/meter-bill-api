import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meters, meterSubmeters } from './meter.schema';
import { CreateMeterDto } from './dtos/create-meter.dto';
import { MeterResponseDto } from './dtos/meter.response.dto';
import { ListMeterQueryDto } from './dtos/list-meter.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import {
  and,
  eq,
  ilike,
  count,
  or,
  isNull,
  sum,
  avg,
  desc,
  notBetween,
  inArray,
  lt,
  isNotNull,
  sql,
  getTableColumns,
  notInArray,
} from 'drizzle-orm';
import { ListUnreadMeterQueryDto } from './dtos/list-unread-meter.dto';
import { MeterType, Operaor } from './enums';
import { MeterStatsResponseDto } from './dtos/meter-stats.response.dto';
import { UpdateMeterStatusDto } from './dtos/update-meter-status.dto';
import { UpdateMeterAreaDto } from './dtos/update-meter-area.dto';
import { UpdateMeterCustomerDto } from './dtos/update-meter-customer.dto';
import { CreateMeterReadingDto } from './dtos/create-meter-reading.dto';
import { MeterReadingService } from './meter-reading.service';
import { ListMeterReadingQueryDto } from './dtos/list-meter-reading-dto';
import { MeterReadingResponseDto } from './dtos/meter-readings.response.dto';
import {
  ReferenceMeterWithConsumption,
  SubMeter,
  SubmeterWithConsumption,
} from './types';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { MeterConsumpptionChartQuerDto } from './dtos/meter-consumption-chart-query.dto';
import { MeterConsumptionChartDataResponse } from './dtos/mete-consumption-chart-data.response.dto';
import {
  mapMeterToConsumptionExceptionResponse,
  mapMeterToResponseDto,
} from './utils';
import { EditMeterReadingDto } from './dtos/edit-meter-reading.dto';
import { EditMeterDto } from './dtos/edit-meter.dto';
import { ConsumptionExceptionMeterResponseDto } from './dtos/consumption-exception-meter.response.dto';
import { MeterStatsFilterDto } from './dtos/meter-stats-filter.dto';
import { EventService } from 'src/event/event.service';
import { EventType } from 'src/event/enums';
import { MeterCreatedEvent } from 'src/event/event-types/meter/meter-created.event';
import { MeterUpdatedEvent } from 'src/event/event-types/meter/meter-updated.event';
import { MeterPayload } from 'src/event/event-types/meter/meter.payload';
import { TariffService } from 'src/tariff/tariff.service';
import { Subscribe } from 'src/event/subscribe.decorator';
import { MeterTariffCreatedEvent } from 'src/event/event-types/tariff/meter-tariff-created.event';
import { MeterTariffPayload } from 'src/event/event-types/tariff/meter-tariff.payload';
import { MeterTariffUpdatedEvent } from 'src/event/event-types/tariff/meter-tariff-updated.event';
import { AreaTariffCreatedEvent } from 'src/event/event-types/tariff/area-tariff-created.event';
import { AreaTariffPayload } from 'src/event/event-types/tariff/area-tariff.payload';
import { AreaTariffUpdatedEvent } from 'src/event/event-types/tariff/area-tariff-updated.event';
import { Decimal } from 'decimal.js';

@Injectable()
export class MeterService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly meterReadingService: MeterReadingService,
    private readonly eventService: EventService,
    private readonly tariffService: TariffService,
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
    let subMeters: Array<SubMeter> = [];
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
    const createdMeterResponse = mapMeterToResponseDto({ ...meter, subMeters });
    // Publish Meter Createed Event
    const meterPayload: MeterPayload = {
      ...createdMeterResponse,
      areaId: createdMeterResponse.areaId!,
      areaName: createdMeterResponse.areaName!,
    };
    const event = new MeterCreatedEvent(EventType.METER_CREATED, meterPayload);
    this.eventService.publish(EventType.METER_CREATED, event);
    return createdMeterResponse;
  }

  async editMeter(meterId: string, editMeterDto: EditMeterDto) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, meterId),
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const result = await this.db
      .update(meters)
      .set({
        ctRating: editMeterDto.ctRating.toString(),
        ctMultiplierFactor: editMeterDto.ctMultiplierFactor.toString(),
        hasMaxKwhReading: editMeterDto.hasMaxKwhReading,
        maxKwhReading: editMeterDto.maxKwhReading?.toString(),
      })
      .where(eq(meters.id, meterId))
      .returning();
    // Publish Meter Updated Event
    const oldMeter = mapMeterToResponseDto({ ...meter, subMeters: [] });
    const oldMeterData: MeterPayload = {
      ...oldMeter,
      areaId: oldMeter.areaId!,
      areaName: oldMeter.areaName!,
    };
    const newMeter = mapMeterToResponseDto({
      ...result[0],
      subMeters: [],
    });
    const updatedMeter: MeterPayload = {
      ...newMeter,
      areaId: newMeter.areaId!,
      areaName: newMeter.areaName!,
    };
    const event = new MeterUpdatedEvent(EventType.METER_UPDATED, {
      old: oldMeterData,
      new: updatedMeter,
    });
    this.eventService.publish(EventType.METER_UPDATED, event);
    return true;
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
      data: meterRows.map(mapMeterToResponseDto),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<MeterResponseDto>;
  }

  async listMetersWithReadingException(
    filter: ListMeterQueryDto,
  ): Promise<PaginatedResponseDto<MeterResponseDto>> {
    const { search, areaId, type, purpose, page = 1, pageSize } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    where.push(
      and(
        isNotNull(meters.currentKwhReading),
        isNotNull(meters.previousKwhReading),
        lt(meters.currentKwhReading, meters.previousKwhReading),
      ),
    );

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
      data: meterRows.map(mapMeterToResponseDto),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<MeterResponseDto>;
  }

  async listMetersWithConsmptionException(
    filter: ListMeterQueryDto,
  ): Promise<PaginatedResponseDto<ConsumptionExceptionMeterResponseDto>> {
    const { search, areaId, type, purpose, page = 1, pageSize } = filter;
    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];
    where.push(
      and(
        isNotNull(meters.currentKwhConsumption),
        isNotNull(meters.previousKwhConsumption),
        sql`ABS((${meters.currentKwhConsumption} - ${meters.previousKwhConsumption}) / NULLIF(${meters.previousKwhConsumption}, 0)) >= 0.2`,
      ),
    );

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
    const meterRows = await this.db
      .select({
        ...getTableColumns(meters),
        subMeters: sql<SubMeter[]>`(
      SELECT json_agg(row_to_json(ms.*))
      FROM meter_sub_meters ms
      WHERE ms.meter_id = ${meters.id}
    )`,
        consumptionChangePercent: sql<number>`
      ROUND(
        ABS((${meters.currentKwhConsumption} - ${meters.previousKwhConsumption}) / NULLIF(${meters.previousKwhConsumption}, 0)) * 100,
        2
      )`,
      })
      .from(meters)
      .where(where.length ? and(...where) : undefined)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(meters.createdAt));

    return {
      data: meterRows.map(mapMeterToConsumptionExceptionResponse),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    } as PaginatedResponseDto<ConsumptionExceptionMeterResponseDto>;
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
        notBetween(
          meters.currentKwhReadingDate,
          new Date(startDate),
          new Date(endDate),
        ),
      ),
    );

    // Filter out derived meters
    where.push(eq(meters.type, MeterType.MEASUREMENT));

    // Filter out inactive meters
    where.push(eq(meters.isActive, true));

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
      data: meterRows.map(mapMeterToResponseDto),
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    };
  }

  async getMeterStats(
    query: MeterStatsFilterDto,
  ): Promise<MeterStatsResponseDto> {
    const { areaId } = query;
    // Total meters
    const totalMetersWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalMetersWhere.push(eq(meters.areaId, areaId));
    const [{ count: totalMeters }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(totalMetersWhere.length ? and(...totalMetersWhere) : undefined);

    // Total active meters
    const totalActiveMetersWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalActiveMetersWhere.push(eq(meters.areaId, areaId));
    totalActiveMetersWhere.push(eq(meters.isActive, true));
    const [{ count: totalActiveMeters }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(
        totalActiveMetersWhere.length
          ? and(...totalActiveMetersWhere)
          : undefined,
      );

    // Total unread meters (currentKwhReadingDate is null)
    const totalUnreadMetersWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalUnreadMetersWhere.push(eq(meters.areaId, areaId));
    totalUnreadMetersWhere.push(
      and(
        isNull(meters.currentKwhReadingDate),
        eq(meters.type, MeterType.MEASUREMENT),
        eq(meters.isActive, true),
      ),
    );
    const [{ count: totalUnreadMeters }] = await this.db
      .select({ count: count() })
      .from(meters)
      .where(
        totalUnreadMetersWhere.length
          ? and(...totalUnreadMetersWhere)
          : undefined,
      );

    // Total energy consumed
    const totalEnergyConsumedWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalEnergyConsumedWhere.push(eq(meters.areaId, areaId));
    const derivedMetersWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) derivedMetersWhere.push(eq(meters.areaId, areaId));
    derivedMetersWhere.push(eq(meters.type, MeterType.DERIVED));
    const derivedMeters = await this.db.query.meters.findMany({
      where: derivedMetersWhere.length ? and(...derivedMetersWhere) : undefined,
    });
    const mainMeterIds = derivedMeters.map(
      (dm) => dm.calculationReferenceMeterId as string,
    );
    totalEnergyConsumedWhere.push(notInArray(meters.id, mainMeterIds));
    const [{ sum: totalEnergyConsumed }] = await this.db
      .select({ sum: sum(meters.currentKwhConsumption) })
      .from(meters)
      .where(
        totalEnergyConsumedWhere.length
          ? and(...totalEnergyConsumedWhere)
          : undefined,
      );

    // Total energy produced (if you have a field for this, adjust accordingly)
    const totalEnergyProducedWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalEnergyProducedWhere.push(eq(meters.areaId, areaId));
    const [{ sum: totalEnergyProduced }] = await this.db
      .select({ sum: sum(meters.lastBillKwhConsumption) })
      .from(meters)
      .where(
        totalEnergyProducedWhere.length
          ? and(...totalEnergyProducedWhere)
          : undefined,
      );

    // Average energy consumption
    const averageEnergyConsumptionWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) averageEnergyConsumptionWhere.push(eq(meters.areaId, areaId));
    const [{ avg: averageEnergyConsumption }] = await this.db
      .select({ avg: avg(meters.currentKwhConsumption) })
      .from(meters)
      .where(
        averageEnergyConsumptionWhere.length
          ? and(...averageEnergyConsumptionWhere)
          : undefined,
      );

    // Average energy production
    const averageEnergyProductionWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) averageEnergyProductionWhere.push(eq(meters.areaId, areaId));
    const [{ avg: averageEnergyProduction }] = await this.db
      .select({ avg: avg(meters.lastBillKwhConsumption) })
      .from(meters)
      .where(
        averageEnergyProductionWhere.length
          ? and(...averageEnergyProductionWhere)
          : undefined,
      );

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
    return mapMeterToResponseDto(meter);
  }

  async listMeterSubMeters(id: string): Promise<MeterResponseDto[]> {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
      with: {
        subMeters: true,
      },
    });
    const subMeterIds = meter?.subMeters.map((sub) => sub.subMeterId);
    if (!subMeterIds) throw new BadRequestException('No sub meters found');
    const subMeters = await this.db.query.meters.findMany({
      where: inArray(meters.id, subMeterIds),
    });
    return subMeters.map(mapMeterToResponseDto);
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
    const result = await this.db
      .update(meters)
      .set({
        isActive: updateStatusDto.isActive,
      })
      .where(eq(meters.id, id))
      .returning();
    // Publish Meter Updated Event
    const oldMeter = mapMeterToResponseDto({ ...meter, subMeters: [] });
    const oldMeterData: MeterPayload = {
      ...oldMeter,
      areaId: oldMeter.areaId!,
      areaName: oldMeter.areaName!,
    };
    const newMeter = mapMeterToResponseDto({
      ...result[0],
      subMeters: [],
    });
    const updatedMeter: MeterPayload = {
      ...newMeter,
      areaId: newMeter.areaId!,
      areaName: newMeter.areaName!,
    };
    const event = new MeterUpdatedEvent(EventType.METER_UPDATED, {
      old: oldMeterData,
      new: updatedMeter,
    });
    this.eventService.publish(EventType.METER_UPDATED, event);
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
    const result = await this.db
      .update(meters)
      .set({
        areaId: updateMeterAreaDto.areaId,
        areaName: updateMeterAreaDto.areaName,
        location: updateMeterAreaDto.location,
      })
      .where(eq(meters.id, id))
      .returning();
    // Publish Meter Updated Event
    const oldMeter = mapMeterToResponseDto({ ...meter, subMeters: [] });
    const oldMeterData: MeterPayload = {
      ...oldMeter,
      areaId: oldMeter.areaId!,
      areaName: oldMeter.areaName!,
    };
    const newMeter = mapMeterToResponseDto({
      ...result[0],
      subMeters: [],
    });
    const updatedMeter: MeterPayload = {
      ...newMeter,
      areaId: newMeter.areaId!,
      areaName: newMeter.areaName!,
    };
    const event = new MeterUpdatedEvent(EventType.METER_UPDATED, {
      old: oldMeterData,
      new: updatedMeter,
    });
    this.eventService.publish(EventType.METER_UPDATED, event);
    return true;
  }

  async updateCustomer(
    id: string,
    updateMeterCustomerDto: UpdateMeterCustomerDto,
  ) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
      with: {
        subMeters: true,
      },
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const result = await this.db
      .update(meters)
      .set({
        customerId: updateMeterCustomerDto.customerId,
        customerName: updateMeterCustomerDto.customerName,
        totalCustomers: updateMeterCustomerDto.totalCustomers.toString(),
      })
      .where(eq(meters.id, id))
      .returning();
    // Publish Meter Updated Event
    const oldMeter = mapMeterToResponseDto({ ...meter, subMeters: [] });
    const oldMeterData: MeterPayload = {
      ...oldMeter,
      areaId: oldMeter.areaId!,
      areaName: oldMeter.areaName!,
    };
    const newMeter = mapMeterToResponseDto({
      ...result[0],
      subMeters: [],
    });
    const updatedMeter: MeterPayload = {
      ...newMeter,
      areaId: newMeter.areaId!,
      areaName: newMeter.areaName!,
    };
    const event = new MeterUpdatedEvent(EventType.METER_UPDATED, {
      old: oldMeterData,
      new: updatedMeter,
    });
    this.eventService.publish(EventType.METER_UPDATED, event);
    return true;
  }

  async updateCurrentMeterTariff(params: { meterId: string }) {
    const currentDate = new Date();
    const currentMeterTariff =
      await this.tariffService.getMeterCurrentDateTariff({
        meterId: params.meterId,
        date: currentDate,
      });
    if (!currentMeterTariff) return;
    await this.db
      .update(meters)
      .set({
        tariff: currentMeterTariff.tariff!.toString(),
      })
      .where(eq(meters.id, params.meterId));
  }

  @Subscribe(EventType.METER_TARIFF_CREATED)
  onMeterTariffCreated(event: MeterTariffCreatedEvent) {
    this.updateCurrentMeterTariff({ meterId: event.data.meterId }).catch((e) =>
      console.error(e),
    );
    this.updateMeterConsumptionTariff(event.data).catch((e) =>
      console.error(e),
    );
  }

  async updateMeterConsumptionTariff(data: MeterTariffPayload) {
    const updatedReadings =
      await this.meterReadingService.updateMeterConsumptionTariff(data);
    console.log(`Total Consumption Tariffs Updated: ${updatedReadings.length}`);
  }

  @Subscribe(EventType.METER_TARIFF_UPDATED)
  onMeterTariffUpdated(event: MeterTariffUpdatedEvent) {
    this.updateCurrentMeterTariff({ meterId: event.data.new.meterId }).catch(
      (e) => console.error(e),
    );
    this.updateMeterConsumptionTariff(event.data.new).catch((e) =>
      console.error(e),
    );
  }

  @Subscribe(EventType.AREA_TARIFF_CREATED)
  onAreaTariffCreated(event: AreaTariffCreatedEvent) {
    this.updateAreaConsumptionTariff(event.data).catch((e) => console.error(e));
  }

  @Subscribe(EventType.AREA_TARIFF_UPDATED)
  onAreaTariffUpdated(event: AreaTariffUpdatedEvent) {
    this.updateAreaConsumptionTariff(event.data.new).catch((e) =>
      console.error(e),
    );
  }

  async updateAreaConsumptionTariff(data: AreaTariffPayload) {
    const BATCH_SIZE = 500;
    let offset = 0;
    while (true) {
      const areaMeters = await this.db.query.meters.findMany({
        where: eq(meters.areaId, data.areaId),
        limit: BATCH_SIZE,
        offset,
      });
      // ✅ Break condition: no more rows
      if (areaMeters.length === 0) break;
      const areaMeterIds = areaMeters.map((meter) => meter.id);
      await this.meterReadingService.updateAreaMetersConsumptionTariff({
        ...data,
        meterIds: areaMeterIds,
      });
      offset += BATCH_SIZE;
    }
    console.log(`Total Consumption Tariffs Updated: ${offset}`);
  }

  async createReading(
    id: string,
    createMeterReadingDto: CreateMeterReadingDto,
  ) {
    const meter = await this.getMeterById({ meterId: id });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const currentKwhReading = meter.currentKwhReading
      ? Number(meter.currentKwhReading)
      : 0;

    //Ensure that selected date is not before the current reading date
    const currentReadingDate = meter.currentKwhReadingDate;
    if (
      currentReadingDate &&
      currentReadingDate > createMeterReadingDto.readingDate
    ) {
      throw new BadRequestException(
        'Invalid reading date, reading date must be after the last meter reading date.',
      );
    }

    const kwhConsumption = this.calculateMeasurementMeterKwhConsumption({
      currentKwhReading: createMeterReadingDto.kwhReading,
      previousKwhReading: currentKwhReading,
      ctMultiplierFactor: Number(meter.ctMultiplierFactor),
      hasMaxKwhReading: meter.hasMaxKwhReading,
      maxKwhReading: Number(meter.maxKwhReading ?? 0),
    });
    const consumptionTariff =
      await this.tariffService.getActiveMeterTariffByConsumptionDate({
        meterId: meter.id,
        areaId: meter.areaId!,
        consumptionDate: createMeterReadingDto.readingDate,
      });
    await this.meterReadingService.createReading({
      ...createMeterReadingDto,
      kwhConsumption,
      meterId: meter.id,
      meterNumber: meter.meterNumber,
      tariff: consumptionTariff ? consumptionTariff.tariff : null,
      tariffId: consumptionTariff ? consumptionTariff.tariffId : null,
      tariffType: consumptionTariff ? consumptionTariff.tariffType : null,
      tariffEffectiveDate: consumptionTariff
        ? consumptionTariff.effectiveFrom
        : null,
      tariffEndDate: consumptionTariff ? consumptionTariff.endDate : null,
      amount: consumptionTariff
        ? new Decimal(kwhConsumption)
            .mul(new Decimal(consumptionTariff.tariff))
            .toNumber()
        : null,
    });
    await this.updateMeterCurrentAndPreviousReadingAndConsumption(id, {
      currentKwhReading: createMeterReadingDto.kwhReading,
      currentKwhReadingDate: createMeterReadingDto.readingDate,
      currentKwhConsumption: kwhConsumption,
      previousKwhReading: currentKwhReading,
      previousKwhConsumption: Number(meter.currentKwhConsumption),
      previousKwhReadingDate: meter.currentKwhReadingDate,
    });
    this.calculateMeterDerivedMeterConsumption({
      meterId: meter.id,
      readingDate: createMeterReadingDto.readingDate,
    }).catch((e) => console.error(e));
    return true;
  }

  calculateMeasurementMeterKwhConsumption(params: {
    currentKwhReading: number;
    previousKwhReading: number;
    ctMultiplierFactor: number;
    hasMaxKwhReading: boolean;
    maxKwhReading: number;
  }): number {
    const currentKwh = new Decimal(params.currentKwhReading);
    const prevKwh = new Decimal(params.previousKwhReading);
    const maxKwh = new Decimal(params.maxKwhReading);
    const multiplierFactor = new Decimal(params.ctMultiplierFactor);
    const crKwhMinusprKwh = currentKwh.minus(prevKwh);
    let kwhConsumption = crKwhMinusprKwh.mul(params.ctMultiplierFactor);
    // If the current kwhReading is less than previous reading
    // but meter does't have maxkwhReading, throw an error
    // the reading is errornoues.
    if (
      params.previousKwhReading > params.currentKwhReading &&
      !params.hasMaxKwhReading
    ) {
      throw new BadRequestException(
        'Invalid kwh reading, meter does not have max kwh reading and does not reset.',
      );
    }
    // If the current kwhReading is less than previous reading
    // and meter has maxKwhReading, calculate consumption
    if (params.previousKwhReading > params.currentKwhReading) {
      const baseCalc = currentKwh.plus(maxKwh).plus(1).minus(prevKwh);
      kwhConsumption = baseCalc.mul(multiplierFactor);
    }
    return kwhConsumption.toNumber();
  }

  async updateMeterCurrentAndPreviousReadingAndConsumption(
    meterId: string,
    params: {
      currentKwhReading: number;
      currentKwhConsumption: number;
      currentKwhReadingDate: Date;
      previousKwhReading: number;
      previousKwhConsumption: number;
      previousKwhReadingDate: Date | null | undefined;
    },
  ) {
    const result = await this.db
      .update(meters)
      .set({
        currentKwhReading: params.currentKwhReading.toString(),
        currentKwhReadingDate: params.currentKwhReadingDate,
        currentKwhConsumption: String(params.currentKwhConsumption),
        previousKwhReading: String(params.previousKwhReading),
        previousKwhConsumption: String(params.previousKwhConsumption),
        previousKwhReadingDate: params.previousKwhReadingDate,
      })
      .where(eq(meters.id, meterId))
      .returning();
    return result.length > 0;
  }

  async editMeterReading(
    meterId: string,
    readingId: string,
    editMeterReadingDto: EditMeterReadingDto,
  ) {
    const meter = await this.getMeterById({ meterId });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const reading = await this.meterReadingService.getReadingById(readingId);
    if (!reading) {
      throw new BadRequestException('Meter reading not found');
    }
    if (meter.id !== reading.meterId) {
      throw new BadRequestException(
        'Meter reading does not belong to this meter.',
      );
    }
    if (
      reading.readingDate.getDate() != meter.currentKwhReadingDate?.getDate() &&
      reading.readingDate.getDate() != meter.previousKwhReadingDate?.getDate()
    ) {
      throw new BadRequestException(
        'Only last two of this meter readings can be edited.',
      );
    }
    const readingPreviousReading =
      await this.meterReadingService.getReadingPreviousReading(reading);
    const readingConsumption = this.calculateMeasurementMeterKwhConsumption({
      currentKwhReading: editMeterReadingDto.kwhReading,
      previousKwhReading: readingPreviousReading
        ? Number(readingPreviousReading.kwhReading)
        : 0,
      ctMultiplierFactor: Number(meter.ctMultiplierFactor),
      hasMaxKwhReading: meter.hasMaxKwhReading,
      maxKwhReading: Number(meter.maxKwhReading ?? 0),
    });
    const consumptionTariff =
      await this.tariffService.getActiveMeterTariffByConsumptionDate({
        meterId: meter.id,
        areaId: meter.areaId!,
        consumptionDate: editMeterReadingDto.readingDate,
      });
    const readingUpdatedReading = await this.meterReadingService.updateReading({
      readingId,
      updateData: {
        kwhReading: editMeterReadingDto.kwhReading.toString(),
        kwhConsumption: readingConsumption.toString(),
        meterImage: editMeterReadingDto.meterImage,
        tariff: consumptionTariff ? String(consumptionTariff.tariff) : null,
        tariffId: consumptionTariff ? consumptionTariff.tariffId : null,
        tariffType: consumptionTariff ? consumptionTariff.tariffType : null,
        tariffEffectiveDate: consumptionTariff
          ? consumptionTariff.effectiveFrom
          : null,
        tariffEndDate: consumptionTariff ? consumptionTariff.endDate : null,
        amount: consumptionTariff
          ? String(readingConsumption * consumptionTariff.tariff)
          : null,
      },
      reason: editMeterReadingDto.reason,
      reading,
    });
    this.calculateMeterDerivedMeterConsumption({
      meterId: meter.id,
      readingDate: readingUpdatedReading.readingDate,
    }).catch((e) => console.error(e));
    // If there is a next reading, recalculate and update its consumption
    // becaue it is affected by the edited reading change.
    const readingNextReading =
      await this.meterReadingService.getReadingNextReading(reading);
    if (readingNextReading) {
      const nextReadingConsumption =
        this.calculateMeasurementMeterKwhConsumption({
          currentKwhReading: Number(readingNextReading.kwhReading),
          previousKwhReading: editMeterReadingDto.kwhReading,
          ctMultiplierFactor: Number(meter.ctMultiplierFactor),
          hasMaxKwhReading: meter.hasMaxKwhReading,
          maxKwhReading: Number(meter.maxKwhReading ?? 0),
        });
      const nextReadingConsumptionTariff =
        await this.tariffService.getActiveMeterTariffByConsumptionDate({
          meterId: meter.id,
          areaId: meter.areaId!,
          consumptionDate: readingNextReading.readingDate,
        });
      await this.meterReadingService.updateReading({
        readingId: readingNextReading.id,
        updateData: {
          kwhConsumption: nextReadingConsumption.toString(),
          tariff: nextReadingConsumptionTariff
            ? String(nextReadingConsumptionTariff.tariff)
            : null,
          tariffId: nextReadingConsumptionTariff
            ? nextReadingConsumptionTariff.tariffId
            : null,
          tariffType: nextReadingConsumptionTariff
            ? nextReadingConsumptionTariff.tariffType
            : null,
          tariffEffectiveDate: nextReadingConsumptionTariff
            ? nextReadingConsumptionTariff.effectiveFrom
            : null,
          tariffEndDate: nextReadingConsumptionTariff
            ? nextReadingConsumptionTariff.endDate
            : null,
          amount: nextReadingConsumptionTariff
            ? String(
                nextReadingConsumption * nextReadingConsumptionTariff.tariff,
              )
            : null,
        },
        reason: `Consumption updated due to previous reading edit: ${readingUpdatedReading.id}`,
        reading: readingNextReading,
      });
      this.calculateMeterDerivedMeterConsumption({
        meterId: meter.id,
        readingDate: readingNextReading.readingDate,
      }).catch((e) => console.error(e));
      const unaffectedReading =
        await this.meterReadingService.getReadingNextReading(
          readingNextReading,
        );
      if (!unaffectedReading) {
        // If there is no next reading, update the meter current reading and consumption
        await this.updateMeterCurrentAndPreviousReadingAndConsumption(meterId, {
          currentKwhReading: Number(readingNextReading.kwhReading),
          currentKwhReadingDate: readingNextReading.readingDate,
          currentKwhConsumption: nextReadingConsumption,
          previousKwhReading: Number(readingUpdatedReading.kwhReading),
          previousKwhConsumption: Number(readingUpdatedReading.kwhConsumption),
          previousKwhReadingDate: readingUpdatedReading.readingDate,
        });
      }
    }
    if (!readingNextReading) {
      // If there is no next reading, update the meter current reading and consumption
      await this.updateMeterCurrentAndPreviousReadingAndConsumption(meterId, {
        currentKwhReading: editMeterReadingDto.kwhReading,
        currentKwhReadingDate: readingUpdatedReading.readingDate,
        currentKwhConsumption: readingConsumption,
        previousKwhReading: readingPreviousReading
          ? Number(readingPreviousReading.kwhReading)
          : 0,
        previousKwhConsumption: Number(
          readingPreviousReading?.kwhConsumption ?? 0,
        ),
        previousKwhReadingDate: readingPreviousReading?.readingDate ?? null,
      });
    }
    return true;
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateMeterDerivedMeterConsumption(params: {
    meterId: string;
    readingDate: Date;
  }) {
    console.log('Calculating Meter Derived Consumption....');
    const windowHours = 24;
    const readingDate = params.readingDate;
    const pastWindowHour = new Date(
      readingDate.getTime() - windowHours * 60 * 60 * 1000,
    );
    const derivedMeterIds: string[] = [];
    const meterAsReferenceDerivedMeters = await this.db.query.meters.findMany({
      where: eq(meters.calculationReferenceMeterId, params.meterId),
    });
    if (meterAsReferenceDerivedMeters.length > 0) {
      const ids = meterAsReferenceDerivedMeters.map((m) => m.id);
      derivedMeterIds.push(...ids);
    }
    const meterAsSubDerivedMeters = await this.db.query.meterSubmeters.findMany(
      {
        where: eq(meterSubmeters.subMeterId, params.meterId),
      },
    );
    if (meterAsSubDerivedMeters.length > 0) {
      const ids = meterAsSubDerivedMeters.map((m) => m.id);
      derivedMeterIds.push(...ids);
    }
    if (derivedMeterIds.length == 0) return;
    const derivedMeters = await this.db.query.meters.findMany({
      where: and(
        eq(meters.type, MeterType.DERIVED),
        inArray(meters.id, derivedMeterIds),
      ),
      with: { subMeters: true },
    });
    // console.log(
    //   'Derived Meters Numbers:',
    //   derivedMeters.map((dm) => dm.meterNumber),
    // );
    const calculationPromise = derivedMeters.map(async (derivedMeter) => {
      const calculationMeterIds = derivedMeter.subMeters.map(
        (sub) => sub.subMeterId,
      );
      calculationMeterIds.push(derivedMeter.calculationReferenceMeterId!);
      const totals =
        await this.meterReadingService.getTotalConsumptionForMeters(
          calculationMeterIds,
          pastWindowHour,
          new Date(readingDate),
        );
      // Stop Calculation for this derived meter if reference meter
      // and all submeters where not read within same period
      if (!(totals.length == calculationMeterIds.length)) return;

      const submeterWithConsumption = derivedMeter.subMeters.map((sub) => {
        return {
          subMeterId: sub.subMeterId,
          operator: sub.operator,
          kwhConsumption: Number(
            totals.find((total) => total.meterId == sub.subMeterId)!
              .totalConsumption,
          ),
        };
      });
      const referenceMeterWithConsumption: ReferenceMeterWithConsumption = {
        referenceMeterId: derivedMeter.calculationReferenceMeterId!,
        kwhConsumption: Number(
          totals.find(
            (total) =>
              total.meterId == derivedMeter.calculationReferenceMeterId,
          )!.totalConsumption,
        ),
      };
      const currentKwhReading = derivedMeter.currentKwhReading
        ? Number(derivedMeter.currentKwhReading)
        : 0;
      const kwhConsumption = this.calculateDerivedMeterConsumption(
        submeterWithConsumption,
        referenceMeterWithConsumption,
      );
      // Delete existing derived meter reading for thesame reading window.
      await this.meterReadingService.deleteMeterReadingByReadingDate({
        meterId: derivedMeter.id,
        startDate: pastWindowHour,
        endDate: new Date(readingDate),
      });
      // store derived meter tariff and  alonside the reading.
      const consumptionTariff =
        await this.tariffService.getActiveMeterTariffByConsumptionDate({
          meterId: derivedMeter.id,
          areaId: derivedMeter.areaId,
          consumptionDate: readingDate,
        });
      await this.meterReadingService.createReading({
        meterImage: 'N/A',
        kwhReading: 0,
        readingDate: new Date(readingDate),
        kwhConsumption,
        meterId: derivedMeter.id,
        meterNumber: derivedMeter.meterNumber,
        tariff: consumptionTariff ? consumptionTariff.tariff : null,
        tariffId: consumptionTariff ? consumptionTariff.tariffId : null,
        tariffType: consumptionTariff ? consumptionTariff.tariffType : null,
        tariffEffectiveDate: consumptionTariff
          ? consumptionTariff.effectiveFrom
          : null,
        tariffEndDate: consumptionTariff ? consumptionTariff.endDate : null,
        amount: consumptionTariff
          ? kwhConsumption * consumptionTariff.tariff
          : null,
      });
      await this.updateMeterCurrentAndPreviousReadingAndConsumption(
        derivedMeter.id,
        {
          currentKwhReading: 0,
          currentKwhReadingDate: new Date(readingDate),
          currentKwhConsumption: kwhConsumption,
          previousKwhReading: currentKwhReading,
          previousKwhConsumption: Number(derivedMeter.currentKwhConsumption),
          previousKwhReadingDate: derivedMeter.currentKwhReadingDate,
        },
      );
    });
    await Promise.all(calculationPromise);
    console.log('Derived Meters Consumptions Calculation Done!');
  }

  calculateDerivedMeterConsumption(
    submeters: SubmeterWithConsumption[],
    referenceMeter: ReferenceMeterWithConsumption,
  ): number {
    let kwhConsumption = new Decimal(0);
    submeters.forEach((sub) => {
      switch (sub.operator as Operaor) {
        case Operaor.ADD:
          kwhConsumption = kwhConsumption.plus(
            new Decimal(referenceMeter.kwhConsumption).plus(
              new Decimal(sub.kwhConsumption),
            ),
          );
          break;
        case Operaor.MINUS:
          kwhConsumption = kwhConsumption.plus(
            new Decimal(referenceMeter.kwhConsumption).minus(
              new Decimal(sub.kwhConsumption),
            ),
          );
          break;
        case Operaor.MULTIPLICATOR:
          kwhConsumption = kwhConsumption.plus(
            new Decimal(referenceMeter.kwhConsumption).mul(
              new Decimal(sub.kwhConsumption),
            ),
          );
          break;
        default:
          break;
      }
    });
    return kwhConsumption.toNumber();
  }

  async deleteMeterDerivedMeterConsumptionByReadingDate(params: {
    meterId: string;
    readingDate: Date;
  }) {
    console.log('Calculating Meter Derived Consumption....');
    const windowHours = 24;
    const readingDate = params.readingDate;
    const pastWindowHour = new Date(
      readingDate.getTime() - windowHours * 60 * 60 * 1000,
    );
    const derivedMeterIds: string[] = [];
    const meterAsReferenceDerivedMeters = await this.db.query.meters.findMany({
      where: eq(meters.calculationReferenceMeterId, params.meterId),
    });
    if (meterAsReferenceDerivedMeters.length > 0) {
      const ids = meterAsReferenceDerivedMeters.map((m) => m.id);
      derivedMeterIds.push(...ids);
    }
    const meterAsSubDerivedMeters = await this.db.query.meterSubmeters.findMany(
      {
        where: eq(meterSubmeters.subMeterId, params.meterId),
      },
    );
    if (meterAsSubDerivedMeters.length > 0) {
      const ids = meterAsSubDerivedMeters.map((m) => m.id);
      derivedMeterIds.push(...ids);
    }
    if (derivedMeterIds.length == 0) return;
    const derivedMeters = await this.db.query.meters.findMany({
      where: and(
        eq(meters.type, MeterType.DERIVED),
        inArray(meters.id, derivedMeterIds),
      ),
      with: { subMeters: true },
    });
    // console.log(
    //   'Derived Meters Numbers:',
    //   derivedMeters.map((dm) => dm.meterNumber),
    // );
    const deletePromise = derivedMeters.map(async (derivedMeter) => {
      // Delete existing derived meter reading for thesame reading window.
      const deletedReadings =
        await this.meterReadingService.deleteMeterReadingByReadingDate({
          meterId: derivedMeter.id,
          startDate: pastWindowHour,
          endDate: new Date(readingDate),
        });
      if (deletedReadings.length == 0) return false;
      const meterLastTwoReadings =
        await this.meterReadingService.getReadingsByMeterId(derivedMeter.id, {
          page: 1,
          pageSize: 2,
        });
      const currentReading =
        meterLastTwoReadings.data.length > 0
          ? meterLastTwoReadings.data[0]
          : null;
      const previousReading =
        meterLastTwoReadings.data.length > 1
          ? meterLastTwoReadings.data[1]
          : null;
      await this.updateMeterCurrentAndPreviousReadingAndConsumption(
        derivedMeter.id,
        {
          currentKwhReading: currentReading
            ? Number(currentReading.kwhReading)
            : 0,
          currentKwhReadingDate: currentReading
            ? currentReading.readingDate
            : new Date(),
          currentKwhConsumption: currentReading
            ? Number(currentReading.kwhConsumption)
            : 0,
          previousKwhReading: previousReading
            ? Number(previousReading.kwhReading)
            : 0,
          previousKwhConsumption: previousReading
            ? Number(previousReading.kwhConsumption)
            : 0,
          previousKwhReadingDate: previousReading
            ? previousReading.readingDate
            : new Date(),
        },
      );
      return true;
    });
    await Promise.all(deletePromise);
    console.log('Meter Derived Meters Affected Readings Deleted Sucessfully!');
  }

  async resetMeterCurrentAndPreviousReadings(meterId: string) {
    const meter = await this.getMeterById({ meterId });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    await this.db
      .update(meters)
      .set({
        currentKwhReading: '0',
        currentKwhReadingDate: null,
        currentKwhConsumption: '0',
        previousKwhReading: '0',
        previousKwhConsumption: '0',
        previousKwhReadingDate: null,
      })
      .where(eq(meters.id, meterId));
    return true;
  }

  async deleteMeterReading(meterId: string, readingId: string) {
    const meter = await this.getMeterById({ meterId });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const reading = await this.meterReadingService.getReadingById(readingId);
    if (!reading) {
      throw new BadRequestException('Meter reading not found');
    }
    const todayDate = new Date();
    const readingEnteryDate = new Date(reading.createdAt);
    if (todayDate.getDate() !== readingEnteryDate.getDate()) {
      throw new BadRequestException(
        'You can only delete readings that were entered today.',
      );
    }
    if (reading.meterId !== meterId) {
      throw new BadRequestException(
        'This reading does not belong to the specified meter.',
      );
    }
    await this.meterReadingService.deleteReadingById(readingId);
    const meterTotalReadings =
      await this.meterReadingService.countReadingsByMeterId(meterId);
    if (meterTotalReadings == 0) {
      await this.resetMeterCurrentAndPreviousReadings(meterId);
      return true;
    }
    // Recalculate and update all derived meters that use this meter
    // as reference or submeter.
    this.deleteMeterDerivedMeterConsumptionByReadingDate({
      meterId: reading.meterId,
      readingDate: reading.readingDate,
    }).catch((e) => console.error(e));
    const meterLastTwoReadings =
      await this.meterReadingService.getReadingsByMeterId(meterId, {
        page: 1,
        pageSize: 2,
      });
    const currentReading =
      meterLastTwoReadings.data.length > 0
        ? meterLastTwoReadings.data[0]
        : null;
    const previousReading =
      meterLastTwoReadings.data.length > 1
        ? meterLastTwoReadings.data[1]
        : null;
    await this.updateMeterCurrentAndPreviousReadingAndConsumption(meterId, {
      currentKwhReading: currentReading ? Number(currentReading.kwhReading) : 0,
      currentKwhReadingDate: currentReading
        ? currentReading.readingDate
        : new Date(),
      currentKwhConsumption: currentReading
        ? Number(currentReading.kwhConsumption)
        : 0,
      previousKwhReading: previousReading
        ? Number(previousReading.kwhReading)
        : 0,
      previousKwhConsumption: previousReading
        ? Number(previousReading.kwhConsumption)
        : 0,
      previousKwhReadingDate: previousReading
        ? previousReading.readingDate
        : new Date(),
    });
    return true;
  }

  async listMeterReadings(
    id: string,
    filter: ListMeterReadingQueryDto,
  ): Promise<PaginatedResponseDto<MeterReadingResponseDto>> {
    const result = await this.meterReadingService.getReadingsByMeterId(id, {
      ...filter,
      readingStartDate: filter.startReadingDate,
      readingEndDate: filter.endReadingDate,
      createdAtStart: filter.startCreatedAt,
      createdAtEnd: filter.endCreatedAt,
    });
    return {
      ...result,
      data: result.data.map((reading) => {
        return {
          ...reading,
          kwhReading: Number(reading.kwhReading),
          kwhConsumption: Number(reading.kwhConsumption),
        };
      }),
    };
  }

  getPastMonths(count: number) {
    const results: { month: string; startDate: Date; endDate: Date }[] = [];

    const now = new Date();

    for (let i = 0; i < count; i++) {
      // Create a date pointing to the 1st of the target month
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const year = date.getFullYear();
      const month = date.getMonth(); // 0-based (0=Jan)

      // Start of month
      const startDate = new Date(year, month, 1, 0, 0, 0);

      // End of month → move to next month, subtract 1 second
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      // Month label: "MonthName-Year"
      const monthName = date.toLocaleString('default', { month: 'long' }); // e.g. "July"
      const label = `${monthName} ${year}`;

      results.push({ month: label, startDate, endDate });
    }

    return results;
  }

  async listMeterConsumptionChartData(
    id: string,
    filter: MeterConsumpptionChartQuerDto,
  ): Promise<MeterConsumptionChartDataResponse[]> {
    const months = this.getPastMonths(filter.numberOfPastMonths);
    const consumptionChartPromise = months.map(async (monthData) => {
      const consumption: number =
        await this.meterReadingService.getConsumptionForMeterByRange({
          meterId: id,
          startDate: monthData.startDate,
          endDate: monthData.endDate,
        });
      return {
        consumption,
        month: monthData.month,
      };
    });
    const consumptionChart = Promise.all(consumptionChartPromise);
    return consumptionChart;
  }

  updateMeterLastBillDetails(
    id: string,
    {
      lastBillKwhConsumption,
      lastBillDate,
      lastBillAmount,
    }: {
      lastBillKwhConsumption: number;
      lastBillDate: Date;
      lastBillAmount: number;
    },
  ): Promise<boolean> {
    return this.db
      .update(meters)
      .set({
        lastBillKwhConsumption: String(lastBillKwhConsumption),
        lastBillDate,
        lastBillAmount: String(lastBillAmount),
      })
      .where(eq(meters.id, id))
      .returning()
      .then((result) => result.length > 0);
  }
}
