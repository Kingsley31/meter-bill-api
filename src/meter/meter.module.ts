import { Module } from '@nestjs/common';
import { MeterController } from './meter.controller';
import { MeterService } from './meter.service';
import { MeterReadingService } from './meter-reading.service';
import { FileModule } from 'src/file/file.module';
import { MeterReadingUpdateService } from './meter-reading-update.service';
import { TariffModule } from 'src/tariff/tariff.module';
import { MeterBillService } from './meter-bill.service';

@Module({
  imports: [FileModule, TariffModule],
  controllers: [MeterController],
  providers: [
    MeterReadingService,
    MeterService,
    MeterReadingUpdateService,
    MeterBillService,
  ],
  exports: [MeterService, MeterBillService],
})
export class MeterModule {}
