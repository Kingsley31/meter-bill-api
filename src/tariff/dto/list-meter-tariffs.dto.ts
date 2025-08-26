import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class ListMeterTariffsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tariff amount',
    example: 1.3,
  })
  @IsOptional()
  @IsNumber()
  tariff?: number;

  @ApiPropertyOptional({
    description:
      'Effective Start date for filtering meter tariffs (ISO 8601 format)',
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFromStart?: Date;

  @ApiPropertyOptional({
    description:
      'Effective End date for filtering meter tariffs (ISO 8601 format)',
    example: '2024-06-30T23:59:59.999Z',
  })
  @ValidateIf(
    (o: ListMeterTariffsQueryDto) =>
      o.effectiveFromStart != null || o.effectiveFromStart != undefined,
  )
  @Type(() => Date)
  @IsDate()
  effectiveFromEnd?: Date;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

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
