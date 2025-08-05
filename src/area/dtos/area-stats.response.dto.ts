import { ApiProperty } from '@nestjs/swagger';

export class AreaStatsResponseDto {
  @ApiProperty({
    description: 'Total number of areas',
    example: 150,
  })
  totalAreas: number;

  @ApiProperty({
    description: 'Total number of areas without meters',
    example: 150,
  })
  totalUnassignedAreas: number;
}
