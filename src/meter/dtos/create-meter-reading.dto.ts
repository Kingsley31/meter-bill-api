import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateMeterReadingDto {
  @ApiProperty({
    description: 'The actual date the meter was read',
    type: String,
    format: 'date-time',
    example: '2024-06-28T15:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  readingDate: Date;

  @ApiProperty({
    type: Number,
    description: 'The reading displayed on the meter',
    example: '123.67',
  })
  @Min(0.01)
  @IsNumber()
  kwhReading: number;

  @ApiProperty({
    type: String,
    description: 'Screenshot of the meter when the reading was captured',
    example: 'https://dummyimage.com/600x300/000/fff.png',
  })
  @IsNotEmpty()
  @IsString()
  meterImage: string;
}
