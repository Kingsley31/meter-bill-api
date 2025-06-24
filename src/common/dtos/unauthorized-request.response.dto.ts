import { ApiResponseProperty } from '@nestjs/swagger';

export class UnauthorizedResponseDto {
  @ApiResponseProperty({
    type: 'string',
    example: 'Unauthorized',
  })
  message: string;

  @ApiResponseProperty({
    type: 'number',
    example: 401,
  })
  statusCode: number;
}
