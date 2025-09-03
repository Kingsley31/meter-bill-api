import { Global, Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';

@Global()
@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class CommonModule {}
