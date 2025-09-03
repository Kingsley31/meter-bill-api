import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { MeterModule } from 'src/meter/meter.module';
import { FileModule } from 'src/file/file.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomerMeterModule } from 'src/customer-meter/customer-meter.module';
import { AreaModule } from 'src/area/area.module';
import { TariffModule } from 'src/tariff/tariff.module';
import { EventModule } from 'src/event/event.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BillModule } from 'src/bill/bill.module';
import { CommonModule } from 'src/common/common.module';
import { QueueModule, QueueType } from 'src/queue/queue.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    QueueModule.forRoot({ type: QueueType.IN_MEMORY }),
    CommonModule,
    EventModule,
    DatabaseModule,
    MeterModule,
    FileModule,
    CustomerMeterModule,
    AreaModule,
    TariffModule,
    BillModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
