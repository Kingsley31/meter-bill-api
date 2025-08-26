import { ApiProperty } from '@nestjs/swagger';

export class MeterTariffResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the meter tariff',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier for the meter tariff',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  meterId: string;

  @ApiProperty({
    description: 'Meter number',
    example: '1234567890',
  })
  meterNumber: string;

  @ApiProperty({
    description: 'Unique identifier for the meter area',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  areaId: string;

  @ApiProperty({
    description: 'The tariff rate per kwh.',
    type: Number,
    example: 1.2,
  })
  tariff: number;

  @ApiProperty({
    description: 'Date the meter tariff will start applying to the meter bill',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  effectiveFrom: Date;

  @ApiProperty({
    description: 'Date the meter tariff was created',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the meter tariff was updated',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  updatedAt: Date;
}
