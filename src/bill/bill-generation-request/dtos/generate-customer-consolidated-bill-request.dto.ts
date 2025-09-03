import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, IsDate } from 'class-validator';

export class CustomerConsolidatedBillGenerationRequest {
  @ApiProperty({
    description: 'Unique X-Request-Id for the bill generation request',
    example: 'REQ-123456',
  })
  @IsNotEmpty()
  @IsString()
  xRequestId: string;

  @ApiProperty({
    description: 'UUID of the customer',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsNotEmpty()
  @IsUUID()
  recipientId: string;

  @ApiProperty({
    description: 'Start date for the bill generation period',
    type: String,
    format: 'date-time',
    example: '2024-07-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description: 'End date for the bill generation period',
    type: String,
    format: 'date-time',
    example: '2024-07-31T23:59:59.999Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
