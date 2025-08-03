import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeterPurpose, MeterType, Operaor } from '../enums';

export class SubMeterResponseDto {
  @ApiProperty({
    description: 'ID of the parent meter',
    format: 'uuid',
    example: 'b7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  meterId: string;

  @ApiProperty({
    description: 'ID of the sub meter',
    format: 'uuid',
    example: 'c8b9e2e1-7d2c-4e3a-8c2d-2e2a3b4c5d7f',
  })
  subMeterId: string;

  @ApiProperty({
    description: 'Calculation Operator of the sub meter',
    enum: Operaor,
    example: Operaor.ADD,
  })
  operator: Operaor;
}

export class ConsumptionExceptionMeterResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the meter',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Meter number',
    example: '1234567890',
  })
  meterNumber: string;

  @ApiPropertyOptional({
    description: 'Area ID associated with the meter',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  areaId: string | null;

  @ApiPropertyOptional({
    description: 'Area name',
    example: 'Lagos Mainland',
    nullable: true,
  })
  areaName?: string | null;

  @ApiProperty({
    description: 'Location of the meter',
    example: 'Block 5, Flat 2, Ikeja',
  })
  location: string;

  @ApiProperty({
    description: 'CT multiplier factor',
    type: Number,
    example: 2.5,
  })
  ctMultiplierFactor: number;

  @ApiProperty({
    description: 'Purpose of the meter',
    enum: MeterPurpose,
    example: MeterPurpose.CONSUMER,
  })
  purpose: MeterPurpose;

  @ApiProperty({
    description: 'Type of the meter',
    enum: MeterType,
    example: MeterType.DERIVED,
  })
  type: MeterType;

  @ApiProperty({
    description: 'Indicates if meter has max kWh reading',
    type: Boolean,
    example: true,
  })
  hasMaxKwhReading: boolean;

  @ApiPropertyOptional({
    description: 'Maximum kWh reading',
    type: Number,
    example: 99999,
    nullable: true,
  })
  maxKwhReading?: number | null;

  @ApiPropertyOptional({
    description: 'List of sub meters',
    type: [SubMeterResponseDto],
    example: [
      {
        meterId: 'b7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
        subMeterId: 'c8b9e2e1-7d2c-4e3a-8c2d-2e2a3b4c5d7f',
        operator: Operaor.ADD,
      },
    ],
    nullable: true,
  })
  subMeters?: SubMeterResponseDto[] | null;

  @ApiProperty({
    description: 'CT rating of the meter',
    type: Number,
    example: 100,
  })
  ctRating: number;

  @ApiProperty({
    description: 'Indicates if the meter is active',
    type: Boolean,
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Customer ID associated with the meter',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  customerId: string | null;

  @ApiPropertyOptional({
    description: 'Customer name associated with the meter',
    example: 'John Doe',
    nullable: true,
  })
  customerName: string | null;

  @ApiProperty({
    description: 'Total number of customers associated with the meter',
    type: Number,
    example: 100,
  })
  totalCustomers: number;

  @ApiPropertyOptional({
    description: 'Tariff assigned to the meter',
    type: Number,
    example: 45.5,
    nullable: true,
  })
  tariff: number | null;

  @ApiPropertyOptional({
    description: 'Current kWh reading of the meter',
    type: Number,
    example: 12345.67,
    nullable: true,
  })
  currentKwhReading: number | null;

  @ApiPropertyOptional({
    description: 'Current kWh consmption of the meter',
    type: Number,
    example: 12345.67,
    nullable: true,
  })
  currentKwhConsumption: number | null;

  @ApiPropertyOptional({
    description: 'Current kWh reading date of the meter',
    type: String,
    format: 'date-time',
    example: '2024-06-28T15:00:00.000Z',
    nullable: true,
  })
  currentKwhReadingDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Previous kWh reading of the meter',
    type: Number,
    example: 12345.67,
    nullable: true,
  })
  previousKwhReading: number | null;

  @ApiPropertyOptional({
    description: 'Previous kWh consmption of the meter',
    type: Number,
    example: 12345.67,
    nullable: true,
  })
  previousKwhConsumption: number | null;

  @ApiPropertyOptional({
    description: 'Previous kWh reading date of the meter',
    type: String,
    format: 'date-time',
    example: '2024-06-28T15:00:00.000Z',
    nullable: true,
  })
  previousKwhReadingDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Last billed kWh consumption',
    type: Number,
    example: 500.25,
    nullable: true,
  })
  lastBillKwhConsumption: number | null;

  @ApiPropertyOptional({
    description: 'Last bill date',
    type: String,
    format: 'date-time',
    example: '2024-06-28T15:00:00.000Z',
    nullable: true,
  })
  lastBillDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Last bill amount',
    type: Number,
    example: 1500.75,
    nullable: true,
  })
  lastBillAmount: number;

  @ApiPropertyOptional({
    description: 'Reference meter ID used for calculation (if type is DERIVED)',
    format: 'uuid',
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  calculationReferenceMeterId?: string | null;

  @ApiProperty({
    description: 'The percent change in consumption of the meter.',
    type: String,
    example: 20,
  })
  consumptionChangePercent: number;

  @ApiProperty({
    description: 'Date the meter was created',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the meter was last updated',
    type: String,
    format: 'date-time',
    example: '2024-06-27T12:34:56.789Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Date the meter was deleted (if applicable)',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:34:56.789Z',
    nullable: true,
  })
  deletedAt?: Date | null;
}
