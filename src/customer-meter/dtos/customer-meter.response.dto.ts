import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeterResponseDto } from 'src/meter/dtos/meter.response.dto';

export class CustomerMeterResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the customer-meter assignment',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the customer',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  customerId: string;

  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe',
  })
  customerName: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'john.doe@example.com',
  })
  customerEmail: string;

  @ApiPropertyOptional({
    description: 'Phone number of the customer',
    example: '+2348012345678',
  })
  customerPhone?: string | null;

  @ApiProperty({
    description: 'UUID of the meter',
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
    description: 'Meter details',
    type: MeterResponseDto,
  })
  meter: MeterResponseDto;

  @ApiProperty({
    description: 'Date the assignment was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the assignment was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Date the assignment was deleted (if applicable)',
    type: String,
    format: 'date-time',
    example: '2024-07-02T08:00:00.000Z',
  })
  deletedAt?: Date | null;
}
