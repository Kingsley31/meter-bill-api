import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import { billBreakdowns } from '../bill.schema';
import { and, count, eq } from 'drizzle-orm';

@Injectable()
export class BillBreakdownService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getBreakdownsByBillId(
    billId: string,
    filter: {
      page?: number;
      pageSize?: number;
    },
  ) {
    const { page = 1, pageSize = 20 } = filter;

    const where: Array<ReturnType<typeof eq>> = [];

    where.push(eq(billBreakdowns.billId, billId));

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: totalCount }] = await this.db
      .select({ count: count() })
      .from(billBreakdowns)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const billBreakdownRows = await this.db.query.billBreakdowns.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset: offset,
      orderBy: (billBreakdowns, { desc }) => [desc(billBreakdowns.createdAt)],
    });

    return {
      data: billBreakdownRows,
      total: totalCount,
      page: page,
      pageSize: pageSize,
      hasMore: totalCount > page * pageSize,
    };
  }
}
