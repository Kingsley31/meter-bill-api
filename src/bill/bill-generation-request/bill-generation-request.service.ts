import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE } from 'src/database/constants';
import schema from 'src/database/schema';
import {
  BillGenerationRequestCreateData,
  billGenerationRequests,
} from '../bill.schema';
import { and, count, eq, gte, ilike, lte } from 'drizzle-orm';
import { BillGenerationRequestStatus } from './bill-generation-request.enums';
import { BillGenrationRequestQueryDto } from './dtos/list-bill-generation-request.dto';

@Injectable()
export class BillGenerationRequestService {
  constructor(
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async billGenerationRequesExists(xRequestId: string) {
    const billGRequest = await this.db.query.billGenerationRequests.findFirst({
      where: eq(billGenerationRequests.xRequestId, xRequestId),
    });
    return billGRequest;
  }

  async createBilGenerationRequest(data: BillGenerationRequestCreateData) {
    const createdBilGenerationRequest = await this.db
      .insert(billGenerationRequests)
      .values(data)
      .returning();
    return createdBilGenerationRequest[0];
  }

  async updateBillGenerationRequestStatus(params: {
    xRequestId: string;
    status: BillGenerationRequestStatus;
    note?: string | undefined;
    completedDate?: Date | undefined;
  }) {
    const updatedBillGRequest = await this.db
      .update(billGenerationRequests)
      .set({
        status: params.status,
        note: params.note,
        completedDate: params.completedDate,
      })
      .where(eq(billGenerationRequests.xRequestId, params.xRequestId))
      .returning();
    return updatedBillGRequest[0];
  }

  async getBillGenerationRequestById(id: string) {
    const billGRequest = await this.db.query.billGenerationRequests.findFirst({
      where: eq(billGenerationRequests.id, id),
    });
    return billGRequest;
  }

  async listBillGenerationRequests(params: BillGenrationRequestQueryDto) {
    const {
      requestDateStart,
      requestDateEnd,
      generationDateStart,
      generationDateEnd,
      xRequestId,
      requestedByUserName,
      requestedByUserId,
      page = 1,
      pageSize,
    } = params;

    const where: Array<ReturnType<typeof eq>> = [];

    if (requestDateStart) {
      where.push(gte(billGenerationRequests.requestDate, requestDateStart));
    }
    if (requestDateEnd) {
      where.push(lte(billGenerationRequests.requestDate, requestDateEnd));
    }
    if (generationDateStart) {
      where.push(gte(billGenerationRequests.startDate, generationDateStart));
    }
    if (generationDateEnd) {
      where.push(lte(billGenerationRequests.endDate, generationDateEnd));
    }
    if (xRequestId) {
      where.push(eq(schema.billGenerationRequests.xRequestId, xRequestId));
    }
    if (requestedByUserName) {
      where.push(
        ilike(
          billGenerationRequests.requestedByUserName,
          `%${requestedByUserName}%`,
        ),
      );
    }

    if (requestedByUserId) {
      where.push(
        eq(billGenerationRequests.requestedByUserId, requestedByUserId),
      );
    }

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.billGenerationRequests)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const data = await this.db.query.billGenerationRequests.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset,
      orderBy: (req, { desc }) => [desc(req.requestDate)],
    });

    return {
      data,
      total: Number(total),
      page,
      pageSize,
      hasMore: offset + data.length < Number(total),
    };
  }
}
