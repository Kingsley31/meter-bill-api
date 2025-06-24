import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(params: {
  model: TModel;
  description?: string;
}) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, params.model),
    ApiOkResponse({
      description: params.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(params.model) },
              },
            },
          },
        ],
      },
    }),
  );
};
