import { Module } from '@nestjs/common';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { FileModule } from 'src/file/file.module';
import { QueueModule } from 'src/queue/queue.module';
import { BILL_PROCESSORS_QUEUENAME } from './constants';
import { BillProcessor } from './bill.processor';
import { BillGenerationRequestService } from './bill-generation-request/bill-generation-request.service';
import { MeterModule } from 'src/meter/meter.module';
import { CustomerMeterModule } from 'src/customer-meter/customer-meter.module';
import { AreaModule } from 'src/area/area.module';
import { BillBreakdownService } from './bill-breakdown/bill-breakdown.service';

@Module({
  imports: [
    QueueModule.registerQueue({ name: BILL_PROCESSORS_QUEUENAME }),
    FileModule,
    MeterModule,
    CustomerMeterModule,
    AreaModule,
  ],
  controllers: [BillController],
  providers: [
    BillService,
    BillProcessor,
    BillGenerationRequestService,
    BillBreakdownService,
  ],
})
export class BillModule {}
