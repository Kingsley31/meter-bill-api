import { IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class ListBillBreakdownQueryDto {
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
