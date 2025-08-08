import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, Min } from 'class-validator';

export class SetAreaTariffDto {
  @ApiProperty({
    description: 'The tariff rate for the area',
    example: 0.15,
    type: Number,
  })
  @Min(0.01)
  @IsNumber()
  tariff: number;

  @ApiProperty({
    description: 'The effective date from which the tariff applies',
    example: '2023-10-01T00:00:00Z',
    type: Date,
  })
  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date;
}
