import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AreaService } from './area.service';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateAreaDto } from './dtos/create-area.dto';
import { AreaResponseDto } from './dtos/area.response.dto';
import { AreaStatsResponseDto } from './dtos/area-stats.response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { ListAreaQueryDto } from './dtos/list-area.dto';

@ApiTags('areas')
@Controller('areas')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new area',
    description: 'Creates a new area with the provided details.',
  })
  @ApiBody({ type: CreateAreaDto })
  @ApiCreatedResponse({
    description: 'The area has been successfully created.',
    type: AreaResponseDto,
  })
  async createArea(@Body() body: CreateAreaDto) {
    return this.areaService.createArea(body);
  }

  @Get()
  @ApiOperation({
    summary: 'List areas',
    description:
      'Returns a paginated list of areas based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: AreaResponseDto })
  async listAreas(
    @Query() filter: ListAreaQueryDto,
  ): Promise<PaginatedResponseDto<AreaResponseDto>> {
    return this.areaService.listAreas(filter);
  }

  @Get('/stats')
  @ApiOperation({
    summary: 'Get areas statistics',
    description: 'Returns statistics about the areas.',
  })
  @ApiOkResponse({
    description: 'The meter statistics have been successfully retrieved.',
    type: AreaStatsResponseDto,
  })
  async getAreaStats(): Promise<AreaStatsResponseDto> {
    return this.areaService.getAreaStats();
  }
}
