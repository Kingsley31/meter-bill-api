import { Module } from '@nestjs/common';
import { MeterController } from './meter.controller';
import { MeterService } from './meter.service';
import { MeterReadingService } from './meter-reading.service';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [FileModule],
  controllers: [MeterController],
  providers: [MeterReadingService, MeterService],
})
export class MeterModule {}
