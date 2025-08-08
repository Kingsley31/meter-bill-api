import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignAreaToLeaderDto {
  @ApiProperty({
    description: 'UUID of the leader',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @IsNotEmpty()
  @IsUUID()
  leaderId: string;

  @ApiProperty({
    description: 'Name of the leader',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  leaderName: string;

  @ApiProperty({
    description: 'Email address of the leader',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  leaderEmail: string;

  @ApiPropertyOptional({
    type: String,
    required: false,
    description: 'Phone number of the leader',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()
  leaderPhone?: string;

  @ApiProperty({
    description: 'UUID of the area',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  @IsNotEmpty()
  @IsUUID()
  areaId: string;

  @ApiProperty({
    description: 'Area name',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  areaName: string;
}
