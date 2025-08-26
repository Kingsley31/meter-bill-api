import { Module } from '@nestjs/common';
import { MeterController } from './meter.controller';
import { MeterService } from './meter.service';
import { MeterReadingService } from './meter-reading.service';
import { FileModule } from 'src/file/file.module';
import { MeterReadingUpdateService } from './meter-reading-update.service';
import { TariffModule } from 'src/tariff/tariff.module';

@Module({
  imports: [FileModule, TariffModule],
  controllers: [MeterController],
  providers: [MeterReadingService, MeterService, MeterReadingUpdateService],
  exports: [MeterService],
})
export class MeterModule {}
