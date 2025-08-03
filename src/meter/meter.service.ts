import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { meters } from './meter.schema';
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
  notBetween,
  inArray,
} from 'drizzle-orm';
import { ListUnreadMeterQueryDto } from './dtos/list-unread-meter.dto';
import { MeterType, Operaor } from './enums';
import { MeterStatsResponseDto } from './dtos/meter-stats.response.dto';
import { UpdateMeterStatusDto } from './dtos/update-meter-status.dto';
import { UpdateMeterAreaDto } from './dtos/update-meter-area.dto';
import { UpdateMeterCustomerDto } from './dtos/update-meter-customer.dto';
import { SetMeterTariffDto } from './dtos/set-meter-tariff.dto';
import { CreateMeterReadingDto } from './dtos/create-meter-reading.dto';
import { MeterReadingService } from './meter-reading.service';
import { ListMeterReadingQueryDto } from './dtos/list-meter-reading-dto';
import { MeterReadingResponseDto } from './dtos/meter-readings.response.dto';
import {
  ReferenceMeterWithConsumption,
  SubMeter,
  SubmeterWithConsumption,
} from './types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MeterConsumpptionChartQuerDto } from './dtos/meter-consumption-chart-query.dto';
import { MeterConsumptionChartDataResponse } from './dtos/mete-consumption-chart-data.response.dto';
import { MeterTariffService } from './meter-tariff.service';
import { mapMeterToResponseDto } from './utils';
import { EditMeterReadingDto } from './dtos/edit-meter-reading.dto';
import { EditMeterDto } from './dtos/edit-meter.dto';

@Injectable()
export class MeterService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly meterReadingService: MeterReadingService,
    private readonly meterTariffService: MeterTariffService,
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
    return mapMeterToResponseDto({ ...meter, subMeters });
  }

  async editMeter(meterId: string, editMeterDto: EditMeterDto) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, meterId),
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    await this.db
      .update(meters)
      .set({
        ctRating: editMeterDto.ctRating.toString(),
        ctMultiplierFactor: editMeterDto.ctMultiplierFactor.toString(),
        hasMaxKwhReading: editMeterDto.hasMaxKwhReading,
        maxKwhReading: editMeterDto.maxKwhReading?.toString(),
      })
      .where(eq(meters.id, meterId));
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
      .where(
        and(
          isNull(meters.currentKwhReadingDate),
          eq(meters.type, MeterType.MEASUREMENT),
          eq(meters.isActive, true),
        ),
      );

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
      .select({ avg: avg(meters.currentKwhConsumption) })
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
    await this.db
      .update(meters)
      .set({
        customerId: updateMeterCustomerDto.customerId,
        customerName: updateMeterCustomerDto.customerName,
        totalCustomers: updateMeterCustomerDto.totalCustomers.toString(),
      })
      .where(eq(meters.id, id));
    return true;
  }

  async setTariff(id: string, setMeterTariffDto: SetMeterTariffDto) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    if (Number(meter.tariff ?? 0) === setMeterTariffDto.tariff) {
      throw new BadRequestException(
        'Meter already has this tariff set, no need to update.',
      );
    }
    const currentDate = new Date();
    if (setMeterTariffDto.effectiveFrom < currentDate) {
      throw new BadRequestException('Effective date must be in the future.');
    }
    const lastSetTariff = await this.meterTariffService.getLastTariffForMeter({
      meterId: meter.id,
      tariff: meter.tariff,
    });
    if (
      lastSetTariff &&
      lastSetTariff.effectiveFrom > setMeterTariffDto.effectiveFrom
    ) {
      throw new BadRequestException(
        'Cannot set a tariff with an effective date earlier than the last set tariff.',
      );
    }
    await this.db
      .update(meters)
      .set({
        tariff: setMeterTariffDto.tariff.toString(),
      })
      .where(eq(meters.id, id));
    await this.meterTariffService.createTariff({
      meterId: meter.id,
      meterNumber: meter.meterNumber,
      tariff: setMeterTariffDto.tariff,
      effectiveFrom: setMeterTariffDto.effectiveFrom,
    });
    return true;
  }

  async listMeterTariff(
    meterId: string,
    filter: {
      tariff?: number;
      effectiveFromStart?: Date;
      effectiveFromEnd?: Date;
      page: number;
      pageSize: number;
    },
  ) {
    const paginatedTariffs = await this.meterTariffService.getTariffsByMeterId(
      meterId,
      filter,
    );
    return paginatedTariffs;
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

    await this.meterReadingService.createReading({
      ...createMeterReadingDto,
      kwhConsumption,
      meterId: meter.id,
      meterNumber: meter.meterNumber,
    });
    await this.updateMeterCurrentAndPreviousReadingAndConsumption(id, {
      currentKwhReading: createMeterReadingDto.kwhReading,
      currentKwhReadingDate: createMeterReadingDto.readingDate,
      currentKwhConsumption: kwhConsumption,
      previousKwhReading: currentKwhReading,
      previousKwhConsumption: Number(meter.currentKwhConsumption),
      previousKwhReadingDate: meter.currentKwhReadingDate,
    });
    return true;
  }

  calculateMeasurementMeterKwhConsumption(params: {
    currentKwhReading: number;
    previousKwhReading: number;
    ctMultiplierFactor: number;
    hasMaxKwhReading: boolean;
    maxKwhReading: number;
  }): number {
    let kwhConsumption =
      (params.currentKwhReading - params.previousKwhReading) *
      params.ctMultiplierFactor;
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
      kwhConsumption =
        (params.currentKwhReading +
          params.maxKwhReading +
          1 -
          params.previousKwhReading) *
        params.ctMultiplierFactor;
    }
    return kwhConsumption;
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
    const readingUpdatedReading = await this.meterReadingService.updateReading({
      readingId,
      updateData: {
        kwhReading: editMeterReadingDto.kwhReading.toString(),
        kwhConsumption: readingConsumption.toString(),
        meterImage: editMeterReadingDto.meterImage,
      },
      reason: editMeterReadingDto.reason,
      reading,
    });
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
      await this.meterReadingService.updateReading({
        readingId: readingNextReading.id,
        updateData: {
          kwhConsumption: nextReadingConsumption.toString(),
        },
        reason: `Consumption updated due to previous reading edit: ${readingUpdatedReading.id}`,
        reading: readingNextReading,
      });
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateDerivedMetersConsumption() {
    console.log('Calculating Derived Meters Consumptions....');
    const windowHours = 24;
    const now = Date.now();
    const pastWindowHour = new Date(now - windowHours * 60 * 60 * 1000);
    const derivedMeters = await this.db.query.meters.findMany({
      where: and(
        eq(meters.type, MeterType.DERIVED),
        or(
          isNull(meters.currentKwhReadingDate),
          notBetween(
            meters.currentKwhReadingDate,
            pastWindowHour,
            new Date(now),
          ),
        ),
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
          new Date(now),
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
      await this.meterReadingService.createReading({
        meterImage: 'N/A',
        kwhReading: 0,
        readingDate: new Date(now),
        kwhConsumption,
        meterId: derivedMeter.id,
        meterNumber: derivedMeter.meterNumber,
      });
      await this.updateMeterCurrentAndPreviousReadingAndConsumption(
        derivedMeter.id,
        {
          currentKwhReading: 0,
          currentKwhReadingDate: new Date(now),
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
    let kwhConsumption = 0;
    submeters.forEach((sub) => {
      switch (sub.operator as Operaor) {
        case Operaor.ADD:
          kwhConsumption =
            kwhConsumption +
            (referenceMeter.kwhConsumption + sub.kwhConsumption);
          break;
        case Operaor.MINUS:
          kwhConsumption =
            kwhConsumption +
            (referenceMeter.kwhConsumption - sub.kwhConsumption);
          break;
        case Operaor.MULTIPLICATOR:
          kwhConsumption =
            kwhConsumption + referenceMeter.kwhConsumption * sub.kwhConsumption;
          break;
        default:
          break;
      }
    });
    return kwhConsumption;
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
