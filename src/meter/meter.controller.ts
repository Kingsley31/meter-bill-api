import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MeterService } from './meter.service';
import { CreateMeterDto } from './dtos/create-meter.dto';
import { MeterResponseDto } from './dtos/meter.response.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { ListMeterQueryDto } from './dtos/list-meter.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { ListUnreadMeterQueryDto } from './dtos/list-unread-meter.dto';
import { MeterStatsResponseDto } from './dtos/meter-stats.response.dto';

@ApiTags('meters')
@Controller('meters')
export class MeterController {
  constructor(private readonly meterService: MeterService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new meter',
    description: 'Creates a new meter with the provided details.',
  })
  @ApiBody({ type: CreateMeterDto })
  @ApiCreatedResponse({
    description: 'The meter has been successfully created.',
    type: MeterResponseDto,
  })
  async createMeter(@Body() createMeterDto: CreateMeterDto) {
    return this.meterService.createMeter(createMeterDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List meters',
    description:
      'Returns a paginated list of meters based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: MeterResponseDto })
  async listMeters(
    @Query() filter: ListMeterQueryDto,
  ): Promise<PaginatedResponseDto<MeterResponseDto>> {
    return this.meterService.listMeters(filter);
  }

  @Get('/unread')
  @ApiOperation({
    summary: 'List unread meters',
    description:
      'Returns a paginated list of meters that has not been read for a specified period based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: MeterResponseDto })
  async lisUnreadtMeters(
    @Query() filter: ListUnreadMeterQueryDto,
  ): Promise<PaginatedResponseDto<MeterResponseDto>> {
    return this.meterService.listUnreadMeters(filter);
  }

  @Get('/stats')
  @ApiOperation({
    summary: 'Get meter statistics',
    description: 'Returns statistics about the meters.',
  })
  @ApiOkResponse({
    description: 'The meter statistics have been successfully retrieved.',
    type: MeterStatsResponseDto,
  })
  async getMeterStats(): Promise<MeterStatsResponseDto> {
    return this.meterService.getMeterStats();
  }
}
