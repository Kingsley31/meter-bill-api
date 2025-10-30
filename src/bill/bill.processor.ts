import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Processor } from 'src/queue/processor';
import { ProcessQueue } from 'src/queue/queue-processor.decorator';
import { BILL_PROCESSORS_QUEUENAME } from './constants';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { PdfService } from 'src/common/services/pdf.service';
import { FileService } from 'src/file/file.service';
import { Readable } from 'stream';
import Handlebars from 'handlebars';
import {
  BillMeter,
  BillPDFPayload,
  GeneratdBillRecipient,
  GeneratedBill,
  GeneratedBillBreakdown,
} from './types';
import {
  BillGenerationRequest,
  BillGenerationRequestCreateData,
  invoiceSequences,
} from './bill.schema';
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
import { sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { CustomerMeterBillService } from 'src/customer-meter/customer-meter-bill.service';
import { BillService } from './bill.service';
import { EventService } from 'src/event/event.service';
import { EventType } from 'src/event/enums';
import { SingleMeterBillGeneratedEvent } from 'src/event/event-types/bill/single-meter-bill-generated.event';
import { AreaBillService } from 'src/area/area-bill.service';
import { AreaConsolidatedBillGeneratedEvent } from 'src/event/event-types/bill/area-consolidated-bill-generated.event';
import { CustomerConsolidatedBillGeneratedEvent } from 'src/event/event-types/bill/customer-consolidated-bill-generated.event';
import { dateToDMYAbbrev, dateToMDYNumeric } from 'src/common/utils';

@Injectable()
@ProcessQueue(BILL_PROCESSORS_QUEUENAME)
export class BillProcessor implements Processor {
  constructor(
    private readonly pdfService: PdfService,
    private readonly fileService: FileService,
    private readonly billGenerationRequestService: BillGenerationRequestService,
    private readonly meterBillService: MeterBillService,
    private readonly customerMeterBillService: CustomerMeterBillService,
    private readonly billService: BillService,
    private readonly areaBillService: AreaBillService,
    private readonly eventService: EventService,
    @Inject(DATABASE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async handle(job: Job<BillGenerationRequest>): Promise<void> {
    console.log(`Job processing ${job.data.xRequestId}`);
    const { data } = job;
    try {
      await this.billGenerationRequestService.updateBillGenerationRequestStatus(
        {
          xRequestId: data.xRequestId,
          status: BillGenerationRequestStatus.PROCESSING,
        },
      );
      if (this.isAreaBillsRequest(data)) {
        await this.gnerateAreaBills(data);
      }
      if (this.isAreaConsolidatedBillRequest(data)) {
        await this.gnerateConsolidatedAreaBill(data);
      }
      if (this.isCustomerConsolidatedBillRequest(data)) {
        await this.gnerateConsolidatedCustomerBill(data);
      }
      await this.billGenerationRequestService.updateBillGenerationRequestStatus(
        {
          xRequestId: data.xRequestId,
          status: BillGenerationRequestStatus.SUCCESS,
          completedDate: new Date(),
        },
      );
      console.log(`Job completed ${job.data.xRequestId}`);
    } catch (e: unknown) {
      let errorMessage: string;

      if (e instanceof Error) {
        // Normal JS Error object
        errorMessage = `${e.message}\n${e.stack ?? ''}`;
      } else if (typeof e === 'string') {
        // Someone threw a string (bad practice, but possible)
        errorMessage = e;
      } else {
        // Anything else (object, number, etc.)
        errorMessage = JSON.stringify(e);
      }
      await this.billGenerationRequestService.updateBillGenerationRequestStatus(
        {
          xRequestId: data.xRequestId,
          status: BillGenerationRequestStatus.FAILED,
          note: errorMessage,
        },
      );
      console.error(`Job failed ${job.data.xRequestId}`, {
        xRequestId: job.data.xRequestId,
        eor: e,
      });
    }
  }

  async gnerateConsolidatedCustomerBill(data: BillGenerationRequest) {
    const customerMeters =
      await this.customerMeterBillService.getCustomerMeters(data.recipientId!);
    if (customerMeters.length == 0) return;
    const customerMeterIds = customerMeters.map((meter) => meter.meterId);
    const customerReadingBreakdowns =
      await this.meterBillService.getCustomerConsolidatedBillBreakdownsForPeriod(
        {
          meterIds: customerMeterIds,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      );
    if (customerReadingBreakdowns.length == 0) return;
    const dateGenerated = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();
    let totalAmountDue = new Decimal(0);
    const customerBillBreakdowns: GeneratedBillBreakdown[] =
      customerReadingBreakdowns.map((breakdown) => {
        totalAmountDue = totalAmountDue.plus(
          new Decimal(breakdown.totalAmount),
        );
        return {
          ...breakdown,
          totalAmount: breakdown.totalAmount.toLocaleString(),
          firstReadKwh: breakdown.firstReadKwh,
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: dateToMDYNumeric(new Date(breakdown.lastReadDate)),
        };
      });
    const customerBill: GeneratedBill = {
      invoiceNumber,
      totalAmountDue: totalAmountDue.toLocaleString(),
      startDate: dateToDMYAbbrev(data.startDate),
      endDate: dateToDMYAbbrev(data.endDate),
      createdAt: dateToDMYAbbrev(dateGenerated),
      requestId: data.xRequestId,
      generateByUserId: data.requestedByUserId,
      generateByUserName: data.requestedByUserName,
      isConsolidated: data.isConsolidated,
      recipientType: data.recipientType,
    };
    const generatedRecipient: GeneratdBillRecipient = {
      name: customerMeters[0].customerName,
    };
    const billPDFPayload: BillPDFPayload = {
      bill: customerBill,
      billBreakdowns: customerBillBreakdowns,
      recipient: generatedRecipient,
    };
    const pdfFileKey = await this.generateAndUploadBillPdf(billPDFPayload);
    const createdBill = await this.billService.createBill({
      ...customerBill,
      startDate: data.startDate,
      endDate: data.endDate,
      areaId: data.areaId,
      areaName: data.areaName,
      scope: data.scope,
      createdAt: dateGenerated,
      pdfUrl: pdfFileKey,
      totalAmountDue: totalAmountDue.toString(),
    });
    await this.billService.createBillBreakdowns(
      customerReadingBreakdowns.map((breakdown) => {
        return {
          ...breakdown,
          billId: createdBill.id,
          totalAmount: breakdown.totalAmount.toString(),
          totalConsumption: breakdown.totalConsumption.toString(),
          tariff: breakdown.tariff.toString(),
          lastReadKwh: breakdown.lastReadKwh.toString(),
          firstReadKwh: breakdown.firstReadKwh.toString(),
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: new Date(breakdown.lastReadDate),
        };
      }),
    );
    const billRecipients = [
      {
        name: customerMeters[0].customerName,
        email: customerMeters[0].customerEmail,
        phoneNumber: customerMeters[0].customerPhone,
        billSent: false,
        billId: createdBill.id,
      },
    ];
    if (billRecipients.length > 0) {
      await this.billService.createBillRecipients(billRecipients);
    }
    const billWithRecipient =
      await this.billService.getBillWithRecipientsByBillId(createdBill.id);
    if (billWithRecipient) {
      const event = new CustomerConsolidatedBillGeneratedEvent(
        EventType.CUSTOMER_CONSOLIDATED_BILL_GENERATED,
        {
          bill: billWithRecipient,
          customerId: data.recipientId!,
          meterIds: customerMeterIds,
        },
      );
      this.eventService.publish(
        EventType.CUSTOMER_CONSOLIDATED_BILL_GENERATED,
        event,
      );
    }
  }

  async gnerateConsolidatedAreaBill(data: BillGenerationRequest) {
    const areaReadingBreakdowns =
      await this.meterBillService.getAreaConsolidatedBillBreakdownsForPeriod({
        areaId: data.areaId!,
        startDate: data.startDate,
        endDate: data.endDate,
      });
    if (areaReadingBreakdowns.length == 0) return;
    const dateGenerated = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();
    let totalAmountDue = new Decimal(0);
    const areaBillBreakdowns: GeneratedBillBreakdown[] =
      areaReadingBreakdowns.map((breakdown) => {
        totalAmountDue = totalAmountDue.plus(
          new Decimal(breakdown.totalAmount),
        );
        return {
          ...breakdown,
          totalAmount: breakdown.totalAmount.toLocaleString(),
          firstReadKwh: breakdown.firstReadKwh,
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: dateToMDYNumeric(new Date(breakdown.lastReadDate)),
        };
      });
    const areaBill: GeneratedBill = {
      invoiceNumber,
      totalAmountDue: totalAmountDue.toLocaleString(),
      startDate: dateToDMYAbbrev(data.startDate),
      endDate: dateToDMYAbbrev(data.endDate),
      createdAt: dateToDMYAbbrev(dateGenerated),
      requestId: data.xRequestId,
      generateByUserId: data.requestedByUserId,
      generateByUserName: data.requestedByUserName,
      isConsolidated: data.isConsolidated,
      recipientType: data.recipientType,
    };
    const areaLeaders = await this.areaBillService.getAreaLeaders(data.areaId!);
    const generatedRecipient: GeneratdBillRecipient = {
      name: data.areaName!,
    };
    const billPDFPayload: BillPDFPayload = {
      bill: areaBill,
      billBreakdowns: areaBillBreakdowns,
      recipient: generatedRecipient,
    };
    const pdfFileKey = await this.generateAndUploadBillPdf(billPDFPayload);
    const createdBill = await this.billService.createBill({
      ...areaBill,
      startDate: data.startDate,
      endDate: data.endDate,
      areaId: data.areaId,
      areaName: data.areaName,
      scope: data.scope,
      createdAt: dateGenerated,
      pdfUrl: pdfFileKey,
      totalAmountDue: areaBill.totalAmountDue.toString(),
    });
    await this.billService.createBillBreakdowns(
      areaReadingBreakdowns.map((breakdown) => {
        return {
          ...breakdown,
          billId: createdBill.id,
          totalAmount: breakdown.totalAmount.toString(),
          totalConsumption: breakdown.totalConsumption.toString(),
          tariff: breakdown.tariff.toString(),
          lastReadKwh: breakdown.lastReadKwh.toString(),
          firstReadKwh: breakdown.firstReadKwh.toString(),
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: new Date(breakdown.lastReadDate),
        };
      }),
    );
    const billRecipients = areaLeaders.map((leader) => {
      return {
        name: leader.leaderName,
        email: leader.leaderEmail,
        phoneNumber: leader.leaderPhone,
        billSent: false,
        billId: createdBill.id,
      };
    });
    if (billRecipients.length > 0) {
      await this.billService.createBillRecipients(billRecipients);
    }
    const billWithRecipient =
      await this.billService.getBillWithRecipientsByBillId(createdBill.id);
    if (billWithRecipient) {
      const event = new AreaConsolidatedBillGeneratedEvent(
        EventType.AREA_CONSOLIDATED_BILL_GENERATED,
        {
          bill: billWithRecipient,
          areaId: data.areaId!,
        },
      );
      this.eventService.publish(
        EventType.AREA_CONSOLIDATED_BILL_GENERATED,
        event,
      );
    }
  }

  async gnerateAreaBills(data: BillGenerationRequest) {
    const BATCH_SIZE = 1000;
    let offset = 0;
    while (true) {
      const meters = await this.meterBillService.getAreaMeters({
        areaId: data.areaId!,
        batchSize: BATCH_SIZE,
        offset,
      });
      offset += BATCH_SIZE;
      if (meters.length == 0) break;
      await this.generateBillForMeters({ meters, data });
    }
  }

  async generateBillForMeters(params: {
    meters: BillMeter[];
    data: BillGenerationRequest;
  }) {
    for (const m of params.meters) {
      await this.generateSingleMeterBill({ meter: m, data: params.data });
    }
  }
  async generateSingleMeterBill(params: {
    meter: BillMeter;
    data: BillGenerationRequest;
  }) {
    const meterReadingBreakdowns =
      await this.meterBillService.getMeterBillBreakdownsForPeriod({
        meterId: params.meter.id,
        startDate: params.data.startDate,
        endDate: params.data.endDate,
      });
    if (meterReadingBreakdowns.length == 0) return;
    const dateGenerated = new Date();
    const invoiceNumber = await this.generateInvoiceNumber();
    let totalAmountDue = new Decimal(0);
    const meterBillBreakdowns: GeneratedBillBreakdown[] =
      meterReadingBreakdowns.map((breakdown) => {
        totalAmountDue = totalAmountDue.plus(
          new Decimal(breakdown.totalAmount),
        );
        return {
          ...breakdown,
          totalAmount: breakdown.totalAmount.toLocaleString(),
          firstReadKwh: breakdown.firstReadKwh,
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: dateToMDYNumeric(new Date(breakdown.lastReadDate)),
        };
      });
    const meterBill: GeneratedBill = {
      invoiceNumber,
      totalAmountDue: totalAmountDue.toLocaleString(),
      startDate: dateToDMYAbbrev(params.data.startDate),
      endDate: dateToDMYAbbrev(params.data.endDate),
      createdAt: dateToDMYAbbrev(dateGenerated),
      requestId: params.data.xRequestId,
      generateByUserId: params.data.requestedByUserId,
      generateByUserName: params.data.requestedByUserName,
      isConsolidated: params.data.isConsolidated,
      recipientType: params.data.recipientType,
    };
    const billPDFPayload: BillPDFPayload = {
      bill: meterBill,
      billBreakdowns: meterBillBreakdowns,
    };
    const pdfFileKey = await this.generateAndUploadBillPdf(billPDFPayload);
    const createdBill = await this.billService.createBill({
      ...meterBill,
      startDate: params.data.startDate,
      endDate: params.data.endDate,
      areaId: params.data.areaId,
      areaName: params.data.areaName,
      scope: params.data.scope,
      createdAt: dateGenerated,
      pdfUrl: pdfFileKey,
      totalAmountDue: totalAmountDue.toString(),
    });
    await this.billService.createBillBreakdowns(
      meterReadingBreakdowns.map((breakdown) => {
        return {
          ...breakdown,
          billId: createdBill.id,
          totalAmount: breakdown.totalAmount.toString(),
          totalConsumption: breakdown.totalConsumption.toString(),
          tariff: breakdown.tariff.toString(),
          lastReadKwh: breakdown.lastReadKwh.toString(),
          firstReadKwh: breakdown.firstReadKwh.toString(),
          firstReadDate: new Date(breakdown.initialReadDate),
          lastReadDate: new Date(breakdown.lastReadDate),
        };
      }),
    );
    const meterCustomers =
      await this.customerMeterBillService.getMeterCustomers(params.meter.id);
    const billRecipients = meterCustomers.map((customer) => {
      return {
        name: customer.customerName,
        email: customer.customerEmail,
        phoneNumber: customer.customerPhone,
        billSent: false,
        billId: createdBill.id,
      };
    });
    if (billRecipients.length > 0) {
      await this.billService.createBillRecipients(billRecipients);
    }
    const billWithRecipient =
      await this.billService.getBillWithRecipientsByBillId(createdBill.id);
    if (billWithRecipient) {
      const event = new SingleMeterBillGeneratedEvent(
        EventType.SINGLE_METER_BILL_GENERATED,
        {
          bill: billWithRecipient,
          meterId: params.meter.id,
        },
      );
      this.eventService.publish(EventType.SINGLE_METER_BILL_GENERATED, event);
    }
  }

  isAreaBillsRequest(data: BillGenerationRequestCreateData): boolean {
    return (
      data.areaId !== null &&
      data.areaId !== undefined &&
      data.scope == BillGenerationRequestScope.AREA_WIDE.toString() &&
      data.recipientType ==
        BillGenerationRequestRecepientType.CUSTOMER.toString()
    );
  }

  isAreaConsolidatedBillRequest(
    data: BillGenerationRequestCreateData,
  ): boolean {
    return (
      data.areaId !== null &&
      data.areaId !== undefined &&
      data.scope == BillGenerationRequestScope.AREA_WIDE.toString() &&
      data.recipientType ==
        BillGenerationRequestRecepientType.AREA_LEADER.toString() &&
      data.isConsolidated == true
    );
  }

  isCustomerConsolidatedBillRequest(
    data: BillGenerationRequestCreateData,
  ): boolean {
    return (
      data.recipientId !== null &&
      data.recipientId !== undefined &&
      data.scope == BillGenerationRequestScope.SYSTEM_WIDE.toString() &&
      data.recipientType ==
        BillGenerationRequestRecepientType.CUSTOMER.toString() &&
      data.isConsolidated == true
    );
  }

  async generateAndUploadBillPdf(data: BillPDFPayload) {
    const hbsHtml = readFileSync(
      resolve(__dirname, 'templates', 'invoice.html'),
      'utf8',
    );
    const template = Handlebars.compile(hbsHtml);
    const html = template(data);
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);
    const fileName = `bill-${Date.now()}`;
    const pseudoMulterFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: Readable.from(pdfBuffer), // not needed for buffer uploads
      destination: '',
      filename: fileName,
      path: '',
    };
    const fileKey = await this.fileService.uploadFile(pseudoMulterFile);
    //console.log('File uploaded with key:', fileKey);
    return fileKey;
  }

  async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // UPSERT: Insert new row with 1 if not exists,
    // otherwise increment lastNumber atomically
    const [row] = await this.db
      .insert(invoiceSequences)
      .values({ date: todayStr, lastNumber: 1 })
      .onConflictDoUpdate({
        target: invoiceSequences.date,
        set: { lastNumber: sql`${invoiceSequences.lastNumber} + 1` },
      })
      .returning({ newNumber: invoiceSequences.lastNumber });

    const sequence = row.newNumber;

    // Format invoice number as YYYYMMDD###
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const paddedSeq = String(sequence).padStart(3, '0');

    return `${year}${month}${day}${paddedSeq}`;
  }
}
