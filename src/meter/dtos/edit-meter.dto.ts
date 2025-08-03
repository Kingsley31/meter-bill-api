import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, ValidateIf } from 'class-validator';

export class EditMeterDto {
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
  @ValidateIf((o: EditMeterDto) => o.hasMaxKwhReading === true)
  @IsNotEmpty({
    message: 'maxKwhReading is required when hasMaxKwhReading is true',
  })
  maxKwhReading?: number | undefined;
}
