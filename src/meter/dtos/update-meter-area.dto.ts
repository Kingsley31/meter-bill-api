import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateMeterAreaDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the area to assign the meter to',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @IsString()
  areaId: string;

  @ApiProperty({
    type: String,
    description: 'The name of the area to assign the meter to',
    example: 'Downtown Area',
  })
  @IsString()
  areaName: string;

  @ApiProperty({
    type: String,
    description: 'The new location of the meter',
    example: '123 Main St, Springfield, USA',
  })
  @IsString()
  location: string;
}
