import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BILL_PROCESSORS_QUEUENAME } from './constants';
import { IMQueue } from 'src/queue/im-queue';
import {
  billBreakdowns,
  bills,
  BillGenerationRequestCreateData,
  CreateBill,
  CreateBillBreakdown,
  CreateBillRecepient,
  recipients,
} from './bill.schema';
import { AreaBillsGenerationRequest } from './bill-generation-request/dtos/generate-area-bills-request.dto';
import { BillGenerationResponse } from './bill-generation-request/dtos/bill-generation-request.response.dto';
import { BillGenerationRequestService } from './bill-generation-request/bill-generation-request.service';
import { MeterBillService } from 'src/meter/meter-bill.service';
import {
  BillGenerationRequestRecepientType,
  BillGenerationRequestScope,
  BillGenerationRequestStatus,
} from './bill-generation-request/bill-generation-request.enums';
import { DATABASE } from 'src/database/constants';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import schema from 'src/database/schema';
import { and, count, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm';
import { AreaConsolidatedBillGenerationRequest } from './bill-generation-request/dtos/generate-area-consolidated-bill-request.dto';
import { CustomerConsolidatedBillGenerationRequest } from './bill-generation-request/dtos/generate-customer-consolidated-bill-request.dto';
import { CustomerMeterBillService } from 'src/customer-meter/customer-meter-bill.service';
import { BillGenrationRequestQueryDto } from './bill-generation-request/dtos/list-bill-generation-request.dto';
import { ListBillQueryDto } from './dtos/list-bills.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { BillResponse } from './dtos/bill.response.dto';
import { FileService } from 'src/file/file.service';
import { BillStatsFilterDto } from './dtos/bill-stats-filter.dto';
import { BillStatsResponseDto } from './dtos/bill-stats.response.dto';
import { PaymentStatus } from './bill.enum';
import { BillBreakdownService } from './bill-breakdown/bill-breakdown.service';
import { ListBillBreakdownQueryDto } from './bill-breakdown/dtos/list-meter-reading-dto';
import { AreaBillService } from 'src/area/area-bill.service';

@Injectable()
export class BillService {
  constructor(
    @Inject(BILL_PROCESSORS_QUEUENAME) private readonly imQueue: IMQueue,
    private readonly billGenerationRequestService: BillGenerationRequestService,
    private readonly meterBillService: MeterBillService,
    private readonly areaBillService: AreaBillService,
    private readonly customerMeterBillService: CustomerMeterBillService,
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly fileSevice: FileService,
    private readonly billBreakdownService: BillBreakdownService,
  ) {}

  async generateAreaBills(
    data: AreaBillsGenerationRequest & {
      requestedByUserId: string;
      requestedByUserName: string;
    },
  ): Promise<BillGenerationResponse> {
    const billRequest: BillGenerationRequestCreateData = {
      ...data,
      scope: BillGenerationRequestScope.AREA_WIDE,
      status: BillGenerationRequestStatus.PENDING,
      recipientType: BillGenerationRequestRecepientType.CUSTOMER,
    };
    const requestExist =
      await this.billGenerationRequestService.billGenerationRequesExists(
        billRequest.xRequestId,
      );
    if (billRequest.startDate > billRequest.endDate) {
      throw new BadRequestException('Start date must be before End date.');
    }
    if (requestExist) {
      throw new BadRequestException(
        `This bill genration requst already exists.`,
      );
    }
    const areaHasBankDetails = await this.areaBillService.areaHasBankDetails(
      billRequest.areaId!,
    );
    if (!areaHasBankDetails) {
      throw new BadRequestException(
        'Bank details has not been set for this area, please set the area bank details and try again.',
      );
    }
    const someReadingsMissingTarriff =
      await this.meterBillService.areaMeterReadingsForPeiodIsMissingTariff({
        areaId: billRequest.areaId!,
        startDate: billRequest.startDate,
        endDate: billRequest.endDate,
      });
    if (someReadingsMissingTarriff) {
      throw new BadRequestException(
        'Some meter readings under this area has no tariff set to them, please set tariff and try again.',
      );
    }
    const createdRequest =
      await this.billGenerationRequestService.createBilGenerationRequest(
        billRequest,
      );

    await this.imQueue.add(BILL_PROCESSORS_QUEUENAME, createdRequest);
    return createdRequest;
  }

  async generateAreaConsolidatedBill(
    data: AreaConsolidatedBillGenerationRequest & {
      requestedByUserId: string;
      requestedByUserName: string;
    },
  ): Promise<BillGenerationResponse> {
    const billRequest: BillGenerationRequestCreateData = {
      ...data,
      scope: BillGenerationRequestScope.AREA_WIDE,
      isConsolidated: true,
      status: BillGenerationRequestStatus.PENDING,
      recipientType: BillGenerationRequestRecepientType.AREA_LEADER,
    };
    const requestExist =
      await this.billGenerationRequestService.billGenerationRequesExists(
        billRequest.xRequestId,
      );
    if (billRequest.startDate > billRequest.endDate) {
      throw new BadRequestException('Start date must be before End date.');
    }
    if (requestExist) {
      throw new BadRequestException(
        `This bill genration requst already exists.`,
      );
    }
    const someReadingsMissingTarriff =
      await this.meterBillService.areaMeterReadingsForPeiodIsMissingTariff({
        areaId: billRequest.areaId!,
        startDate: billRequest.startDate,
        endDate: billRequest.endDate,
      });
    if (someReadingsMissingTarriff) {
      throw new BadRequestException(
        'Some meter readings under this area has no tariff set to them, please set tariff and try again.',
      );
    }
    const createdRequest =
      await this.billGenerationRequestService.createBilGenerationRequest(
        billRequest,
      );

    await this.imQueue.add(BILL_PROCESSORS_QUEUENAME, createdRequest);
    return createdRequest;
  }

  async generateCustomerConsolidatedBill(
    data: CustomerConsolidatedBillGenerationRequest & {
      requestedByUserId: string;
      requestedByUserName: string;
    },
  ): Promise<BillGenerationResponse> {
    const billRequest: BillGenerationRequestCreateData = {
      ...data,
      scope: BillGenerationRequestScope.SYSTEM_WIDE,
      isConsolidated: true,
      status: BillGenerationRequestStatus.PENDING,
      recipientType: BillGenerationRequestRecepientType.CUSTOMER,
    };
    const requestExist =
      await this.billGenerationRequestService.billGenerationRequesExists(
        billRequest.xRequestId,
      );
    if (billRequest.startDate > billRequest.endDate) {
      throw new BadRequestException('Start date must be before End date.');
    }
    if (requestExist) {
      throw new BadRequestException(
        `This bill genration requst already exists.`,
      );
    }
    const customerMeters =
      await this.customerMeterBillService.getCustomerMeters(data.recipientId);
    const customerMeterIds = customerMeters.map((meter) => meter.meterId);
    const someReadingsMissingTarriff =
      await this.meterBillService.customerMeterReadingsForPeiodIsMissingTariff({
        meterIds: customerMeterIds,
        startDate: billRequest.startDate,
        endDate: billRequest.endDate,
      });
    if (someReadingsMissingTarriff) {
      throw new BadRequestException(
        'Some of the customers meter readings has no tariff set to them, please set tariff and try again.',
      );
    }
    const createdRequest =
      await this.billGenerationRequestService.createBilGenerationRequest(
        billRequest,
      );

    await this.imQueue.add(BILL_PROCESSORS_QUEUENAME, createdRequest);
    return createdRequest;
  }

  async createBill(data: CreateBill) {
    const bill = await this.db.insert(bills).values(data).returning();
    return bill[0];
  }

  async createBillBreakdowns(data: CreateBillBreakdown[]) {
    const breakdowns = await this.db
      .insert(billBreakdowns)
      .values(data)
      .returning();
    return breakdowns;
  }

  async createBillRecipients(data: CreateBillRecepient[]) {
    const billRecipients = await this.db
      .insert(recipients)
      .values(data)
      .returning();
    return billRecipients;
  }

  async getBillWithRecipientsByBillId(billId: string) {
    const bill = await this.db.query.bills.findFirst({
      where: eq(bills.id, billId),
      with: {
        billRecipients: true,
      },
    });
    return bill;
  }

  async listBillGenerationRequests(filter: BillGenrationRequestQueryDto) {
    return await this.billGenerationRequestService.listBillGenerationRequests(
      filter,
    );
  }

  async listBills(
    filter: ListBillQueryDto,
  ): Promise<PaginatedResponseDto<BillResponse>> {
    const {
      search,
      generatedStartDate,
      generatedEndDate,
      requestId,
      scope,
      areaId,
      isConsolidated,
      pageSize,
      page = 1,
    } = filter;

    const where: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];
    if (search) {
      const foundRecipiens = await this.db.query.recipients.findMany({
        where: ilike(recipients.name, `%${search}%`),
      });
      const billIds = foundRecipiens.map((rp) => rp.billId);
      const conditions = [
        ilike(bills.invoiceNumber, `%${search}%`),
        ilike(bills.areaName, `%${search}%`),
      ];

      if (billIds.length > 0) {
        const inArrayCondition = inArray(bills.id, billIds);
        conditions.push(inArrayCondition);
      }
      where.push(or(...conditions));
    }
    if (generatedStartDate) {
      where.push(gte(bills.startDate, new Date(generatedStartDate)));
    }
    if (generatedEndDate) {
      where.push(lte(bills.endDate, new Date(generatedEndDate)));
    }
    if (scope) {
      where.push(eq(bills.scope, scope));
    }
    if (requestId) {
      where.push(eq(bills.requestId, requestId));
    }
    if (areaId) {
      where.push(eq(bills.areaId, areaId));
    }
    if (typeof isConsolidated === 'boolean') {
      where.push(eq(bills.isConsolidated, isConsolidated));
    }

    const offset = (page - 1) * pageSize;

    // Get total count
    const [{ count: total }] = await this.db
      .select({ count: count() })
      .from(schema.bills)
      .where(where.length ? and(...where) : undefined);

    // Get paginated data
    const billsData = await this.db.query.bills.findMany({
      where: where.length ? and(...where) : undefined,
      limit: pageSize,
      offset,
      orderBy: (bill, { desc }) => [desc(bill.createdAt)],
      with: {
        billRecipients: true,
      },
    });
    const mappedBillPromise = billsData.map(async (bill) => {
      return {
        ...bill,
        totalAmountDue: Number(bill.totalAmountDue),
        pdfUrl: await this.fileSevice.getSignedUrl(bill.pdfUrl!),
      };
    });
    const mappedBills = await Promise.all(mappedBillPromise);

    return {
      data: mappedBills as BillResponse[],
      total: Number(total),
      page,
      pageSize,
      hasMore: offset + billsData.length < Number(total),
    };
  }

  async getBillStats(
    filter: BillStatsFilterDto,
  ): Promise<BillStatsResponseDto> {
    const { areaId } = filter;
    // Total Payable bills
    const totalPayableBillsWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalPayableBillsWhere.push(eq(bills.areaId, areaId));
    totalPayableBillsWhere.push(eq(bills.isConsolidated, false));
    const [{ count: totalPayableBills }] = await this.db
      .select({ count: count() })
      .from(bills)
      .where(
        totalPayableBillsWhere.length
          ? and(...totalPayableBillsWhere)
          : undefined,
      );

    // Total Paid bills
    const totalPaidBillsWhere: Array<
      ReturnType<typeof eq> | ReturnType<typeof or>
    > = [];
    if (areaId) totalPaidBillsWhere.push(eq(bills.areaId, areaId));
    totalPaidBillsWhere.push(eq(bills.paymentStatus, PaymentStatus.PAID));
    const [{ count: totalPaidBills }] = await this.db
      .select({ count: count() })
      .from(bills)
      .where(
        totalPaidBillsWhere.length ? and(...totalPaidBillsWhere) : undefined,
      );

    return {
      totalPayable: Number(totalPayableBills),
      totalPaid: Number(totalPaidBills),
    };
  }

  async getBillById(params: { billId: string }): Promise<BillResponse> {
    const bill = await this.db.query.bills.findFirst({
      where: eq(bills.id, params.billId),
      with: {
        billRecipients: true,
      },
    });
    if (!bill) {
      throw new BadRequestException('Bill not found');
    }
    const mappedBill = {
      ...bill,
      totalAmountDue: Number(bill.totalAmountDue),
      pdfUrl: await this.fileSevice.getSignedUrl(bill.pdfUrl!),
    };
    return mappedBill as BillResponse;
  }

  async listBillBreakdowns(billId: string, filter: ListBillBreakdownQueryDto) {
    const bill = await this.db.query.bills.findFirst({
      where: eq(bills.id, billId),
    });
    if (!bill) {
      throw new BadRequestException('Bill not found');
    }
    const response = await this.billBreakdownService.getBreakdownsByBillId(
      billId,
      filter,
    );
    return response;
  }
}
