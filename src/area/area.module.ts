import { Module } from '@nestjs/common';
import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { AreaTariffService } from '../tariff/area-tariff.service';
import { AreaLeaderService } from './area-leader.service';
import { TariffModule } from 'src/tariff/tariff.module';

@Module({
  imports: [TariffModule],
  controllers: [AreaController],
  providers: [AreaService, AreaTariffService, AreaLeaderService],
  exports: [AreaService],
})
export class AreaModule {}
