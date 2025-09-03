import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsString,
  IsDateString,
  ValidateIf,
} from 'class-validator';

export class BillGenrationRequestQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for the bill request (ISO 8601 format)',
    example: '2024-07-01T00:00:00.000Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  requestDateStart?: Date | undefined;

  @ApiPropertyOptional({
    description: 'End date for the bill request (ISO 8601 format)',
    example: '2024-07-31T23:59:59.999Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ValidateIf(
    (o: BillGenrationRequestQueryDto) =>
      o.requestDateStart !== undefined && o.requestDateStart !== null,
  )
  @IsNotEmpty()
  @IsDateString()
  requestDateEnd?: Date | undefined;

  @ApiPropertyOptional({
    type: String,
    description: 'X-Request-Id for the bill generation request',
    example: 'REQ-123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  xRequestId?: string | undefined;

  @ApiPropertyOptional({
    type: String,
    description: 'Username of the user who requested the bill generation',
    example: 'kingsley',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestedByUserName?: string | undefined;

  @ApiPropertyOptional({
    type: String,
    description: 'User ID of the user who requested the bill generation',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    required: false,
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  requestedByUserId?: string | undefined;

  @ApiPropertyOptional({
    description: 'Start date for the bill generation (ISO 8601 format)',
    example: '2024-07-01T00:00:00.000Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  generationDateStart?: Date | undefined;

  @ApiPropertyOptional({
    description: 'End date for the bill generation (ISO 8601 format)',
    example: '2024-07-31T23:59:59.999Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ValidateIf(
    (o: BillGenrationRequestQueryDto) =>
      o.generationDateStart !== undefined && o.generationDateStart !== null,
  )
  @IsNotEmpty()
  @IsDateString()
  generationDateEnd?: Date | undefined;

  @ApiPropertyOptional({
    type: Number,
    description: 'Page number for pagination',
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    type: Number,
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  pageSize: number;
}
