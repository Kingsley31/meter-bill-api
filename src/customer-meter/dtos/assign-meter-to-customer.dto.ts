import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignMeterToCustomerDto {
  @ApiProperty({
    description: 'UUID of the customer',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Phone number of the customer',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  customerPhone?: string;

  @ApiProperty({
    description: 'UUID of the meter',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  @IsNotEmpty()
  @IsUUID()
  meterId: string;

  @ApiProperty({
    description: 'Meter number',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  meterNumber: string;
}
