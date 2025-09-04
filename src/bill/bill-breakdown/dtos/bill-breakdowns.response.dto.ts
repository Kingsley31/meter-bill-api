import { ApiProperty } from '@nestjs/swagger';

export class BillBreakdownResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the bill breakdown',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the area',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  areaId: string;

  @ApiProperty({
    description: 'Name of the area',
    example: 'Lagos Mainland',
  })
  areaName: string;

  @ApiProperty({
    description: 'Date the bill breakdown was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the bill breakdown was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'UUID of the bill',
    format: 'uuid',
    example: 'b1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  billId: string;

  @ApiProperty({
    description: 'UUID of the meter',
    format: 'uuid',
    example: 'c1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  meterId: string;

  @ApiProperty({
    description: 'Location of the meter',
    example: 'Block 5, Flat 2, Ikeja',
  })
  location: string;

  @ApiProperty({
    description: 'Meter number',
    example: '1234567890',
  })
  meterNumber: string;

  @ApiProperty({
    description: 'Date of the last meter reading',
    type: String,
    format: 'date-time',
    example: '2024-07-31T23:59:59.999Z',
  })
  lastReadDate: Date;

  @ApiProperty({
    description: 'Date of the first meter reading',
    type: String,
    format: 'date-time',
    example: '2024-07-01T00:00:00.000Z',
  })
  firstReadDate: Date;

  @ApiProperty({
    description: 'First meter reading in kWh',
    example: '1000.50',
  })
  firstReadKwh: string;

  @ApiProperty({
    description: 'Last meter reading in kWh',
    example: '1500.75',
  })
  lastReadKwh: string;

  @ApiProperty({
    description: 'Total consumption in kWh',
    example: '500.25',
  })
  totalConsumption: string;

  @ApiProperty({
    description: 'Tariff applied for the billing period',
    example: '0.15',
  })
  tariff: string;

  @ApiProperty({
    description: 'Total amount due for the billing period',
    example: '75.00',
  })
  totalAmount: string;
}
