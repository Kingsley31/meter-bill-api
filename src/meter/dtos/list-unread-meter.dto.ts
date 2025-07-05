import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { MeterPurpose, MeterType } from '../enums';

export class ListUnreadMeterQueryDto {
  @ApiPropertyOptional({
    description: 'UUID of the area to filter meters',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiPropertyOptional({
    description: 'Type of the meter',
    enum: MeterType,
    example: MeterType.MEASUREMENT,
  })
  @IsOptional()
  @IsEnum(MeterType)
  type?: MeterType;

  @ApiPropertyOptional({
    description: 'Purpose of the meter',
    enum: MeterPurpose,
    example: MeterPurpose.CONSUMER,
  })
  @IsOptional()
  @IsEnum(MeterPurpose)
  purpose?: MeterPurpose;

  @ApiPropertyOptional({
    description: 'Search term for meter number or customer name or location',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Start date for filtering unread meters (ISO 8601 format)',
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for filtering unread meters (ISO 8601 format)',
    example: '2024-06-30T23:59:59.999Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size for pagination',
    example: 20,
    default: 20,
  })
  @IsOptional()
  pageSize?: number;
}
