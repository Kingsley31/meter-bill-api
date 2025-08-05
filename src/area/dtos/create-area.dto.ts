import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({
    description: 'Name of the area',
    example: 'Lagos Mainland',
  })
  @IsNotEmpty()
  @IsString()
  areaName: string;

  @ApiProperty({
    description: 'Address of the area',
    example: '123 Adeola Odeku Street',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City where the area is located',
    example: 'Lagos',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State where the area is located',
    example: 'Lagos State',
  })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Country where the area is located',
    example: 'Nigeria',
  })
  @IsNotEmpty()
  @IsString()
  country: string;
}
