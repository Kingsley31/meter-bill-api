import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AreaService } from './area.service';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateAreaDto } from './dtos/create-area.dto';
import { AreaResponseDto } from './dtos/area.response.dto';
import { AreaStatsResponseDto } from './dtos/area-stats.response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { ListAreaQueryDto } from './dtos/list-area.dto';
import { AssignAreaToLeaderDto } from './dtos/assign-area-to-leader.dto';
import { AreaLeaderResponseDto } from './dtos/area-leader.response.dto';
import { ListAreaLeaderQueryDto } from './dtos/list-area-leader.dto';
import { UpdateAreaBankDetailsDto } from './dtos/update-area-bank-details.dto';

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

  @Get(':id')
  @ApiOperation({
    summary: 'Get area by ID',
    description: 'Returns a area.',
  })
  @ApiOkResponse({
    description: 'The meter have been successfully retrieved.',
    type: AreaResponseDto,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the area',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  async getAreaById(@Param('id') id: string): Promise<AreaResponseDto> {
    return this.areaService.getAreaById({ areaId: id });
  }

  @Patch(':id/bank-details')
  @ApiOperation({
    summary: 'Update an Area bank details',
    description: 'Update an Area bank details for bill payment by area ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the area',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiOkResponse({
    description: 'Area bank details updated successfully.',
    type: Boolean,
  })
  async updateAreaBankDetail(
    @Param('id') id: string,
    @Body() body: UpdateAreaBankDetailsDto,
  ) {
    return this.areaService.updateAreaBankDetail(id, body);
  }

  @Post(':id/leaders')
  @ApiOperation({
    summary: 'Assign an area to a leader',
    description: 'Assigns an area to a leader using the provided details.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the area',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiOkResponse({
    description: 'Area successfully assigned to leader.',
    type: Boolean,
  })
  async assignAreaToLeader(
    @Param('id') id: string,
    @Body() body: AssignAreaToLeaderDto,
  ) {
    return this.areaService.assignAreaToLeader(id, body);
  }

  @Get(':id/leaders')
  @ApiOperation({
    summary: 'List leaders assigned to an area',
    description:
      'Returns a paginated list of leaders assigned to an area based on the provided filters.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the area',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiPaginatedResponse({ model: AreaLeaderResponseDto })
  async listAreaLeaders(
    @Param('id') id: string,
    @Query() filter: ListAreaLeaderQueryDto,
  ): Promise<PaginatedResponseDto<AreaLeaderResponseDto>> {
    return this.areaService.listAreaLeaders(id, filter);
  }
}
