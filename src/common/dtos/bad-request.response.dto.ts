import { ApiResponseProperty } from '@nestjs/swagger';

export class BadRequestRequestDto {
  @ApiResponseProperty({
    example: ['Some error message.'],
  })
  message: string | string[];

  @ApiResponseProperty({
    type: 'string',
    example: 'Bad Request',
  })
  error: string;

  @ApiResponseProperty({
    type: 'number',
    example: 400,
  })
  statusCode: number;
}
