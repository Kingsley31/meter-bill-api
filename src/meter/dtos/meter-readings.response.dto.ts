import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeterReadingResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the meter reading',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier for the meter',
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
    description: 'The reading in kwh displayed on the meter.',
    type: Number,
    example: 600,
  })
  kwhReading: number;

  @ApiProperty({
    description: 'The calculated kwh consumption.',
    type: Number,
    example: 100,
  })
  kwhConsumption: number;

  @ApiProperty({
    description: 'Date the reading was taking',
    type: String,
    format: 'date-time',
    example: '2024-06-28T15:00:00.000Z',
  })
  readingDate: Date;

  @ApiProperty({
    description: 'Screenshot of the meter when the reading was captured',
    example: 'https://dummyimage.com/600x300/000/fff.png',
  })
  meterImage: string;

  @ApiProperty({
    description: 'Date the reading was created',
    type: String,
    format: 'date-time',
    example: '2024-06-26T12:34:56.789Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the reading was last updated',
    type: String,
    format: 'date-time',
    example: '2024-06-27T12:34:56.789Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Date the reading was deleted (if applicable)',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:34:56.789Z',
    nullable: true,
  })
  deletedAt?: Date | null;
}
