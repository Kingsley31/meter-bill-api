import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from 'src/database/database.module';
import { MeterModule } from 'src/meter/meter.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [DatabaseModule, MeterModule, FileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
