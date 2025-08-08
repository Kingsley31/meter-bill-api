import { Module } from '@nestjs/common';
import { AreaController } from './area.controller';
import { AreaService } from './area.service';
import { AreaTariffService } from './area-tariff.service';
import { AreaLeaderService } from './area-leader.service';

@Module({
  controllers: [AreaController],
  providers: [AreaService, AreaTariffService, AreaLeaderService],
  exports: [AreaService],
})
export class AreaModule {}
