import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class MeterConsumpptionChartQuerDto {
  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Number of past months consumption data to return',
  })
  @Min(2)
  @IsNumber()
  numberOfPastMonths: number;
}
