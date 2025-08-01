import { Module } from '@nestjs/common';
import { MeterController } from './meter.controller';
import { MeterService } from './meter.service';
import { MeterReadingService } from './meter-reading.service';
import { FileModule } from 'src/file/file.module';
import { MeterTariffService } from './meter-tariff.service';
import { MeterReadingUpdateService } from './meter-reading-update.service';

@Module({
  imports: [FileModule],
  controllers: [MeterController],
  providers: [
    MeterReadingService,
    MeterService,
    MeterTariffService,
    MeterReadingUpdateService,
  ],
  exports: [MeterService],
})
export class MeterModule {}
