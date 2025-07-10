import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class SetMeterTariffDto {
  @ApiProperty({
    description: 'The tariff rate for the meter',
    example: 0.15,
    type: Number,
  })
  @Min(0.01)
  @IsNumber()
  tariff: number;
}
