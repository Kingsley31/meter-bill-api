import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AssignMeterToCustomerDto } from './dtos/assign-meter-to-customer.dto';
import { MeterService } from 'src/meter/meter.service';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { customerMeters } from './customer-meter.schema';
import { and, between, count, eq, ilike, or } from 'drizzle-orm';
import { ListMeterCustomerQueryDto } from './dtos/list-meter-customers.dto';
import { PaginatedResponseDto } from '../common/dtos/paginated-response.dto';
import { CustomerMeterResponseDto } from './dtos/customer-meter.response.dto';
import { mapMeterToResponseDto } from 'src/meter/utils';

@Injectable()
export class CustomerMeterSevice {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly meterService: MeterService,
  ) {}

  async assignMeterToCustomer(
    params: AssignMeterToCustomerDto,
  ): Promise<boolean> {
    const meter = await this.meterService.getMeterById({
      meterId: params.meterId,
    });
    if (!meter) {
      throw new BadRequestException('Meter not found');
    }
    await this.db.insert(customerMeters).values(params).returning();
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(customerMeters)
      .where(eq(customerMeters.meterId, params.meterId));

    await this.meterService.updateCustomer(params.meterId, {
      customerId: params.customerId,
      customerName: params.customerName,
      totalCustomers: totalCount,
    });
    return true;
  }

  async listMeterCustomers(
    meterId: string,
    filter: ListMeterCustomerQueryDto,
  ): Promise<PaginatedResponseDto<CustomerMeterResponseDto>> {
    const {
      search,
      createdAtStart,
      createdAtEnd,
      page = 1,
      pageSize = 20,
    } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [
      eq(customerMeters.meterId, meterId),
    ];
    if (search) {
      where.push(
        or(
          ilike(customerMeters.customerName, search),
          ilike(customerMeters.customerEmail, search),
          ilike(customerMeters.customerPhone, search),
        ),
      );
    }
    if (createdAtStart && createdAtEnd) {
      where.push(
        between(customerMeters.createdAt, createdAtStart, createdAtEnd),
      );
    }
    const offset = (page - 1) * pageSize;
    const customerMeterRows = await this.db.query.customerMeters.findMany({
      where: and(...where),
      with: { meter: true },
      limit: pageSize,
      offset: offset,
      orderBy: (customerMeters, { desc }) => desc(customerMeters.createdAt),
    });
    const totalCount = await this.db
      .select({ count: count() })
      .from(customerMeters)
      .where(where.length ? and(...where) : undefined);

    return {
      data: customerMeterRows.map((customerMeter) => ({
        ...customerMeter,
        meter: mapMeterToResponseDto({ ...customerMeter.meter, subMeters: [] }),
      })),
      total: totalCount[0].count,
      page,
      pageSize,
      hasMore: totalCount[0].count > page * pageSize,
    };
  }

  async deleteMeterCustomer(params: { meterId: string; customerId: string }) {
    const customerMeter = await this.db.query.customerMeters.findFirst({
      where: and(
        eq(customerMeters.meterId, params.meterId),
        eq(customerMeters.customerId, params.customerId),
      ),
    });
    if (!customerMeter) {
      throw new BadRequestException('Customer meter assignment not found');
    }
    await this.db
      .delete(customerMeters)
      .where(
        and(
          eq(customerMeters.meterId, params.meterId),
          eq(customerMeters.customerId, params.customerId),
        ),
      )
      .returning();
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(customerMeters)
      .where(eq(customerMeters.meterId, params.meterId));
    const lastAssignedCustomer = await this.db.query.customerMeters.findFirst({
      where: eq(customerMeters.meterId, params.meterId),
      orderBy: (customerMeters, { desc }) => desc(customerMeters.createdAt),
    });
    const dummyUuid = '0f4f2453-a209-4d49-8fa7-a5023a8a5d1c';
    await this.meterService.updateCustomer(params.meterId, {
      customerId: lastAssignedCustomer?.customerId ?? dummyUuid,
      customerName: lastAssignedCustomer?.customerName ?? 'None',
      totalCustomers: totalCount,
    });
    return true;
  }
}
