import { ApiPropertyOptional } from '@nestjs/swagger';

export class BillStatsResponseDto {
  @ApiPropertyOptional({
    description: 'Total number of bills that recipients can pay for.',
    example: 150,
  })
  totalPayable?: number;

  @ApiPropertyOptional({
    description: 'Total number of bills that have been paid for.',
    example: 120,
  })
  totalPaid?: number;
}
