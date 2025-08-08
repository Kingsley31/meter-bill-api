import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AreaResponseDto } from 'src/area/dtos/area.response.dto';

export class AreaLeaderResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the area leader assignment',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'UUID of the leader',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  leaderId: string;

  @ApiProperty({
    description: 'Name of the leader',
    example: 'John Doe',
  })
  leaderName: string;

  @ApiProperty({
    description: 'Email address of the leader',
    example: 'john.doe@example.com',
  })
  leaderEmail: string;

  @ApiPropertyOptional({
    description: 'Phone number of the leader',
    example: '+2348012345678',
  })
  leaderPhone?: string | null;

  @ApiProperty({
    description: 'UUID of the area',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  areaId: string;

  @ApiProperty({
    description: 'Area name',
    example: '1234567890',
  })
  areaName: string;

  @ApiProperty({
    description: 'Area details',
    type: AreaResponseDto,
  })
  area: AreaResponseDto;

  @ApiProperty({
    description: 'Date the assignment was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the assignment was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Date the assignment was deleted (if applicable)',
    type: String,
    format: 'date-time',
    example: '2024-07-02T08:00:00.000Z',
  })
  deletedAt?: Date | null;
}
