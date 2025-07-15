import { ApiProperty } from '@nestjs/swagger';

export class MeterConsumptionChartDataResponse {
  @ApiProperty({
    type: String,
    example: 'Jan 2025',
    description: 'The consumption month with year',
  })
  month: string;

  @ApiProperty({
    type: Number,
    example: 3000,
    description: 'The kwh consumption within the month',
  })
  consumption: number;
}
