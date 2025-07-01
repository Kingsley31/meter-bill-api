import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { MeterModule } from 'src/meter/meter.module';

@Module({
  imports: [DatabaseModule, MeterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
