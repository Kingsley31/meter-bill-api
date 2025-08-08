import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class ListAreaLeaderQueryDto {
  @ApiProperty({
    description: 'Search term to filter leaders by name, email or phone',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering leaders by assigned date',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAtStart?: Date;

  @ApiPropertyOptional({
    description: 'End date for filtering leaders by assigned date',
    type: String,
    format: 'date-time',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ValidateIf(
    (o: ListAreaLeaderQueryDto) =>
      o.createdAtStart != null || o.createdAtStart != undefined,
  )
  @Type(() => Date)
  @IsDate()
  createdAtEnd?: Date;

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
