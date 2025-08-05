import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListAreaQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term for area name or address or state or city or country.',
    example: 'lekki',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
