import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BillStatsFilterDto {
  @ApiProperty({
    type: String,
    description: 'UUID of the area',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsOptional()
  @IsString()
  areaId?: string;
}
