import { Module } from '@nestjs/common';
import { MeterModule } from 'src/meter/meter.module';
import { CustomerMeterController } from './customer-meter.controller';
import { CustomerMeterSevice } from './customer-meter.service';

@Module({
  imports: [MeterModule],
  controllers: [CustomerMeterController],
  providers: [CustomerMeterSevice],
})
export class CustomerMeterModule {}
