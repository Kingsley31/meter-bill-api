import { Module } from '@nestjs/common';
import { SupabaseFileService } from './supabase-file.service';
import { FileService } from './file.service';
import { FileController } from './file.controller';

@Module({
  providers: [{ provide: FileService, useValue: new SupabaseFileService() }],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
