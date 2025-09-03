import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { customerMeters } from './customer-meter.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CustomerMeterBillService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getMeterCustomers(meterId: string) {
    const meterCustomers = await this.db.query.customerMeters.findMany({
      where: eq(customerMeters.meterId, meterId),
    });
    return meterCustomers;
  }

  async getCustomerMeters(customerId: string) {
    const customerMeterRows = await this.db.query.customerMeters.findMany({
      where: eq(customerMeters.customerId, customerId),
    });
    return customerMeterRows;
  }
}
