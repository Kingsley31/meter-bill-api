import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({
    type: 'string',
    example: 'b0e41177-cafa-4cb1-8db6-ed099b1a88aa',
    description: 'The value of nextCursor in previus response.',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor: string;

  @ApiProperty({
    type: 'number',
    example: 20,
    description: 'Number of items to return.',
  })
  @IsNumber()
  pageSize: number;
}
