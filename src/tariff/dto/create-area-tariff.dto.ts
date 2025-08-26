import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAreaTariffDto {
  @ApiProperty({
    description: 'Area ID',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsNotEmpty()
  @IsUUID()
  areaId: string;

  @ApiProperty({
    description: 'Name of the area',
    example: 'Lagos Mainland',
  })
  @IsNotEmpty()
  @IsString()
  areaName: string;

  @ApiProperty({
    description: 'The tariff rate for the area',
    example: 0.15,
    type: Number,
  })
  @Min(0.01)
  @IsNumber()
  tariff: number;

  @ApiProperty({
    description: 'The effective date from which the tariff applies',
    example: '2023-10-01T00:00:00Z',
    type: Date,
  })
  @Type(() => Date)
  @IsDate()
  effectiveFrom: Date;
}
