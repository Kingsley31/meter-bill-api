import { ApiResponseProperty } from '@nestjs/swagger';

export class PaginatedDataMeta {
  @ApiResponseProperty({
    type: 'string',
    example: 'b0e41177-cafa-4cb1-8db6-ed099b1a88aa',
  })
  nextCursor: string;

  @ApiResponseProperty({
    type: 'number',
    example: 20,
  })
  pageSize: number;
}
export class PaginatedResponseDto<T> {
  data: T[];

  @ApiResponseProperty({
    type: PaginatedDataMeta,
  })
  meta: PaginatedDataMeta;
}
