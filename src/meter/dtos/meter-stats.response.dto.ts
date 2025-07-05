import { ApiPropertyOptional } from '@nestjs/swagger';

export class MeterStatsResponseDto {
  @ApiPropertyOptional({
    description: 'Total number of meters',
    example: 150,
  })
  totalMeters?: number;

  @ApiPropertyOptional({
    description: 'Total number of active meters',
    example: 120,
  })
  totalActiveMeters?: number;

  @ApiPropertyOptional({
    description: 'Total number of unread meters',
    example: 30,
  })
  totalUnreadMeters?: number;

  @ApiPropertyOptional({
    description: 'Total energy consumed (in kWh)',
    example: 50000,
  })
  totalEnergyConsumed?: number;

  @ApiPropertyOptional({
    description: 'Total energy produced (in kWh)',
    example: 20000,
  })
  totalEnergyProduced?: number;

  @ApiPropertyOptional({
    description: 'Average energy consumption (in kWh)',
    example: 350,
  })
  averageEnergyConsumption?: number;

  @ApiPropertyOptional({
    description: 'Average energy production (in kWh)',
    example: 180,
  })
  averageEnergyProduction?: number;
}
