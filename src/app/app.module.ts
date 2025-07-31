import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { MeterModule } from 'src/meter/meter.module';
import { FileModule } from 'src/file/file.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomerMeterModule } from 'src/customer-meter/customer-meter.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    MeterModule,
    FileModule,
    CustomerMeterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
