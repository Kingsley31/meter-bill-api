import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BillGenerationResponse {
  @ApiProperty({
    description: 'Unique identifier for the bill generation request',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Unique X-Request-Id for the bill generation request',
    example: 'REQ-123456',
  })
  xRequestId: string;

  @ApiProperty({
    description: 'User ID of the user who requested the bill generation',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  requestedByUserId: string;

  @ApiProperty({
    description: 'Username of the user who requested the bill generation',
    example: 'john.doe',
  })
  requestedByUserName: string;

  @ApiProperty({
    description: 'Date the bill generation request was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  requestDate: Date;

  @ApiPropertyOptional({
    description: 'Date the bill generation request was completed',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
    nullable: true,
  })
  completedDate?: Date | null;

  @ApiProperty({
    description:
      'Scope of the bill generation request (e.g. area-wide, system-wide)',
    example: 'area-wide',
  })
  scope: string;

  @ApiProperty({
    description: 'Whether the bill generation is consolidated',
    example: false,
  })
  isConsolidated: boolean;

  @ApiProperty({
    description: 'Start date for the bill generation period',
    type: String,
    format: 'date-time',
    example: '2024-07-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date for the bill generation period',
    type: String,
    format: 'date-time',
    example: '2024-07-31T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Recipient type for the bill generation request',
    example: 'customer',
  })
  recipientType: string;

  @ApiPropertyOptional({
    description: 'Recipient ID for the bill generation request',
    format: 'uuid',
    example: 'b2b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  recipientId?: string | null;

  @ApiPropertyOptional({
    description: 'Area ID for the bill generation request',
    format: 'uuid',
    example: 'c3c9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  areaId?: string | null;

  @ApiPropertyOptional({
    description: 'Area name for the bill generation request',
    example: 'Lagos Mainland',
    nullable: true,
  })
  areaName?: string | null;

  @ApiProperty({
    description: 'Status of the bill generation request',
    example: 'pending',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Additional note for the bill generation request',
    example: 'Monthly bill for July',
    nullable: true,
  })
  note?: string | null;
}
