import { Module } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { MeterTariffService } from './meter-tariff.service';
import { AreaTariffService } from './area-tariff.service';
import { TariffController } from './tariff.controller';

@Module({
  providers: [TariffService, MeterTariffService, AreaTariffService],
  controllers: [TariffController],
  exports: [TariffService],
})
export class TariffModule {}
