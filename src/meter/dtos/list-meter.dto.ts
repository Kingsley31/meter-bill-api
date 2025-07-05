import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { MeterPurpose, MeterType } from '../enums';

export class ListMeterQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for meter number or customer name or location',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Area ID to filter meters',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiPropertyOptional({
    description: 'Type of the meter',
    enum: MeterType,
    example: MeterType.DERIVED,
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
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  pageSize: number;
}
