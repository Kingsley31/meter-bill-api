import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeterPurpose, MeterType, Operaor } from '../enums';

export class SubMeterDto {
  @ApiProperty({
    description: 'ID of the sub meter',
    format: 'uuid',
    example: 'c8b9e2e1-7d2c-4e3a-8c2d-2e2a3b4c5d7f',
  })
  @IsNotEmpty()
  @IsUUID()
  subMeterId: string;

  @ApiProperty({
    description: 'Calculation Operator of the sub meter',
    enum: Operaor,
    example: Operaor.ADD, // Replace with a valid enum value
  })
  @IsNotEmpty()
  @IsEnum(Operaor)
  operator: Operaor;
}

export class CreateMeterDto {
  @ApiProperty({
    description: 'Meter number',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  meterNumber: string;

  @ApiProperty({
    description: 'Area ID',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsNotEmpty()
  @IsUUID()
  areaId: string;

  @ApiProperty({
    description: 'Area name',
    example: 'Lagos Mainland',
  })
  @IsNotEmpty()
  @IsString()
  areaName: string;

  @ApiProperty({
    description: 'CT rating of the meter',
    type: Number,
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  ctRating: number;

  @ApiProperty({
    description: 'CT multiplier factor',
    type: Number,
    example: 2.5,
  })
  @IsNumber()
  ctMultiplierFactor: number;

  @ApiProperty({
    description: 'Purpose of the meter',
    enum: MeterPurpose,
    example: MeterPurpose.CONSUMER, // Replace with a valid enum value
  })
  @IsNotEmpty()
  @IsEnum(MeterPurpose)
  purpose: MeterPurpose;

  @ApiProperty({
    description: 'Type of the meter',
    enum: MeterType,
    example: MeterType.DERIVED, // Replace with a valid enum value
  })
  @IsNotEmpty()
  @IsEnum(MeterType)
  type: MeterType;

  @ApiPropertyOptional({
    description:
      'Reference meter ID used for calculation (required if type is DERIVED)',
    format: 'uuid',
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ValidateIf((o: CreateMeterDto) => o.type === MeterType.DERIVED)
  @IsNotEmpty({
    message: 'calculationReferenceMeterId is required when type is DERIVED',
  })
  @IsUUID('4', { message: 'calculationReferenceMeterId must be a valid UUID' })
  calculationReferenceMeterId?: string | undefined;

  @ApiProperty({
    description: 'Indicates if meter has max kWh reading',
    type: Boolean,
    example: true,
  })
  @IsBoolean()
  hasMaxKwhReading: boolean;

  @ApiPropertyOptional({
    description: 'Maximum kWh reading',
    type: Number,
    example: 99999,
  })
  @ValidateIf((o: CreateMeterDto) => o.hasMaxKwhReading === true)
  @IsNotEmpty({
    message: 'maxKwhReading is required when hasMaxKwhReading is true',
  })
  maxKwhReading?: number | undefined;

  @ApiPropertyOptional({
    description: 'List of sub meters (required when type is DERIVED)',
    type: [SubMeterDto],
    example: [
      {
        subMeterId: 'c8b9e2e1-7d2c-4e3a-8c2d-2e2a3b4c5d7f',
        operator: Operaor.ADD,
      },
    ],
  })
  @ValidateIf((o: CreateMeterDto) => o.type === MeterType.DERIVED)
  @IsNotEmpty({ message: 'subMeters is required when type is DERIVED' })
  @ValidateNested({ each: true })
  @Type(() => SubMeterDto)
  subMeters?: SubMeterDto[] | undefined;
}
