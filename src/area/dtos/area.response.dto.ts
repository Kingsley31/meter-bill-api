import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AreaResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the area',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the area',
    example: 'Lagos Mainland',
  })
  areaName: string;

  @ApiProperty({
    description: 'Address of the area',
    example: '123 Adeola Odeku Street',
  })
  address: string;

  @ApiProperty({
    description: 'City where the area is located',
    example: 'Lagos',
  })
  city: string;

  @ApiProperty({
    description: 'State where the area is located',
    example: 'Lagos State',
  })
  state: string;

  @ApiProperty({
    description: 'Country where the area is located',
    example: 'Nigeria',
  })
  country: string;

  @ApiProperty({
    description: 'Total number of meters in the area',
    example: 50,
  })
  totalMeters: number;

  @ApiPropertyOptional({
    description: 'Type of the area',
    example: 'Residential',
    nullable: true,
  })
  type?: string | null;

  @ApiPropertyOptional({
    description: 'Current tariff for the area',
    type: Number,
    example: 45.5,
    nullable: true,
  })
  currentTariff?: number | null;

  @ApiPropertyOptional({
    description: 'Total kWh reading for the area',
    type: Number,
    example: 123456.78,
    nullable: true,
  })
  totalKwhReading?: number | null;

  @ApiPropertyOptional({
    description: 'Total kWh consumption for the area',
    type: Number,
    example: 98765.43,
    nullable: true,
  })
  totalKwhConsumption?: number | null;

  @ApiPropertyOptional({
    description: 'Last bill kWh consumption for the area',
    type: Number,
    example: 5000.25,
    nullable: true,
  })
  lastBillKwhConsumption?: number | null;

  @ApiPropertyOptional({
    description: 'Date of the last bill for the area',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
    nullable: true,
  })
  lastBillDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Amount of the last bill for the area',
    type: Number,
    example: 150000.0,
    nullable: true,
  })
  lastBillAmount?: number | null;

  @ApiProperty({
    description: 'Date the area was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the area was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;
}
