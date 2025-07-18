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
import { MeterType, MeterPurpose, Operaor } from './enums';
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
  SubmeterWithConsumption,
} from './types';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MeterConsumpptionChartQuerDto } from './dtos/meter-consumption-chart-query.dto';
import { MeterConsumptionChartDataResponse } from './dtos/mete-consumption-chart-data.response.dto';

@Injectable()
export class MeterService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly meterReadingService: MeterReadingService,
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
        currentKwhConsumption:
          meter.currentKwhConsumption !== null &&
          meter.currentKwhConsumption !== undefined
            ? Number(meter.currentKwhConsumption)
            : null,
        previousKwhReading:
          meter.previousKwhReading !== null &&
          meter.previousKwhReading !== undefined
            ? Number(meter.previousKwhReading)
            : null,
        previousKwhConsumption:
          meter.previousKwhConsumption !== null &&
          meter.previousKwhConsumption !== undefined
            ? Number(meter.previousKwhConsumption)
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
    return subMeters.map((sub) => {
      return {
        ...sub,
        ctRating: sub.ctRating !== null ? Number(sub.ctRating) : 0,
        ctMultiplierFactor:
          sub.ctMultiplierFactor !== null ? Number(sub.ctMultiplierFactor) : 0,
        maxKwhReading:
          sub.maxKwhReading !== null ? Number(sub.maxKwhReading) : 0,
        subMeters: [],
        purpose: sub.purpose as MeterPurpose,
        type: sub.type as MeterType,
        tariff:
          sub.tariff !== null && sub.tariff !== undefined
            ? Number(sub.tariff)
            : null,
        currentKwhReading:
          sub.currentKwhReading !== null && sub.currentKwhReading !== undefined
            ? Number(sub.currentKwhReading)
            : null,
        currentKwhConsumption:
          sub.currentKwhConsumption !== null &&
          sub.currentKwhConsumption !== undefined
            ? Number(sub.currentKwhConsumption)
            : null,
        previousKwhReading:
          sub.previousKwhReading !== null &&
          sub.previousKwhReading !== undefined
            ? Number(sub.previousKwhReading)
            : null,
        previousKwhConsumption:
          sub.previousKwhConsumption !== null &&
          sub.previousKwhConsumption !== undefined
            ? Number(sub.previousKwhConsumption)
            : null,
        lastBillKwhConsumption:
          sub.lastBillKwhConsumption !== null &&
          sub.lastBillKwhConsumption !== undefined
            ? Number(sub.lastBillKwhConsumption)
            : null,
      };
    });
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
      })
      .where(eq(meters.id, id));
    return true;
  }

  async setTariff(id: string, setMeterTariffDto: SetMeterTariffDto) {
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
        tariff: setMeterTariffDto.tariff.toString(),
      })
      .where(eq(meters.id, id));
    return true;
  }

  async createReading(
    id: string,
    createMeterReadingDto: CreateMeterReadingDto,
  ) {
    const meter = await this.db.query.meters.findFirst({
      where: eq(meters.id, id),
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    const currentKwhReading = meter.currentKwhReading
      ? Number(meter.currentKwhReading)
      : 0;
    if (
      currentKwhReading > createMeterReadingDto.kwhReading &&
      !meter.hasMaxKwhReading
    ) {
      throw new BadRequestException(
        'Invalid kwh reading, meter does not have max kwh reading and does not reset.',
      );
    }

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

    let kwhConsumption =
      (createMeterReadingDto.kwhReading - currentKwhReading) *
      Number(meter.ctMultiplierFactor);
    if (currentKwhReading > createMeterReadingDto.kwhReading) {
      kwhConsumption =
        (createMeterReadingDto.kwhReading +
          Number(meter.maxKwhReading) +
          1 -
          currentKwhReading) *
        Number(meter.ctMultiplierFactor);
    }

    await this.meterReadingService.createReading({
      ...createMeterReadingDto,
      kwhConsumption,
      meterId: meter.id,
      meterNumber: meter.meterNumber,
    });
    await this.db
      .update(meters)
      .set({
        currentKwhReading: createMeterReadingDto.kwhReading.toString(),
        currentKwhReadingDate: createMeterReadingDto.readingDate,
        currentKwhConsumption: String(kwhConsumption),
        previousKwhReading: String(currentKwhReading),
        previousKwhConsumption: meter.currentKwhConsumption,
        previousKwhReadingDate: meter.currentKwhReadingDate,
      })
      .where(eq(meters.id, id));
    return true;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateDerivedMetersConsumption() {
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
      await this.db
        .update(meters)
        .set({
          currentKwhReading: '0',
          currentKwhReadingDate: new Date(now),
          currentKwhConsumption: String(kwhConsumption),
          previousKwhReading: String(currentKwhReading),
          previousKwhConsumption: derivedMeter.currentKwhConsumption,
          previousKwhReadingDate: derivedMeter.currentKwhReadingDate,
        })
        .where(eq(meters.id, derivedMeter.id));
    });
    await Promise.all(calculationPromise);
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
}
