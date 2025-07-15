import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { MeterModule } from 'src/meter/meter.module';
import { FileModule } from 'src/file/file.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, MeterModule, FileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
