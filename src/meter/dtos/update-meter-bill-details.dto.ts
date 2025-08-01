import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber } from 'class-validator';

export class UpdateMeterBillDetailsDto {
  @ApiProperty({
    type: Number,
    description: 'The meter last bill amount',
    example: 250.75,
  })
  @IsNumber()
  lastBillAmount: number;

  @ApiProperty({
    type: Number,
    description: 'The meter last bill kWh consumption',
    example: 150.5,
  })
  @IsNumber()
  lastBillKwhConsumption: number;

  @ApiProperty({
    type: Date,
    description: 'The date of the last bill',
    example: '2023-10-01T00:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  lastBillDate: Date;
}
