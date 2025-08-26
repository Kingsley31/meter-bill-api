import { ApiProperty } from '@nestjs/swagger';

export class AreaTariffResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the area tariff',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier for the area tariff',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  areaId: string;

  @ApiProperty({
    description: 'Area name',
    example: 'Ikeja',
  })
  areaName: string;

  @ApiProperty({
    description: 'The tariff rate per kwh.',
    type: Number,
    example: 1.2,
  })
  tariff: number;

  @ApiProperty({
    description: 'Date the area tariff will start applying to the area bill',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  effectiveFrom: Date;

  @ApiProperty({
    description: 'Date the area tariff was created',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the area tariff was updated',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  updatedAt: Date;
}
