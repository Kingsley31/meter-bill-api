import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMeterStatusDto {
  @ApiProperty({
    type: Boolean,
    description: 'The meter active status',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
