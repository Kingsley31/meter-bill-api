import { ApiResponseProperty } from '@nestjs/swagger';

export class ForbiddenResponseDto {
  @ApiResponseProperty({
    type: 'string',
    example: 'Forbidden resource',
  })
  message: string;

  @ApiResponseProperty({
    type: 'string',
    example: 'Forbidden',
  })
  error: string;

  @ApiResponseProperty({
    type: 'number',
    example: 403,
  })
  statusCode: number;
}
