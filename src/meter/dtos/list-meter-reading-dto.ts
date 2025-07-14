import {
  IsOptional,
  IsNumber,
  Min,
  IsNotEmpty,
  IsDate,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListMeterReadingQueryDto {
  @ApiPropertyOptional({
    description:
      'Reading Date Start date for filtering meter readings (ISO 8601 format)',
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startReadingDate?: Date;

  @ApiPropertyOptional({
    description:
      'Reading Date End date for filtering meter readings (ISO 8601 format)',
    example: '2024-06-30T23:59:59.999Z',
  })
  @ValidateIf(
    (o: ListMeterReadingQueryDto) =>
      o.startReadingDate != null || o.startReadingDate != undefined,
  )
  @Type(() => Date)
  @IsDate()
  endReadingDate?: Date;

  @ApiPropertyOptional({
    description:
      'Created At Start date for filtering meter readings (ISO 8601 format)',
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startCreatedAt?: Date;

  @ApiPropertyOptional({
    description:
      'Created At End date for filtering meter readings (ISO 8601 format)',
    example: '2024-06-30T23:59:59.999Z',
  })
  @ValidateIf(
    (o: ListMeterReadingQueryDto) =>
      o.startCreatedAt != null || o.startCreatedAt != undefined,
  )
  @Type(() => Date)
  @IsDate()
  endCreatedAt?: Date;

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
