import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TariffService } from './tariff.service';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { CreateMeterTariffDto } from './dto/create-meter-tariff.dto';
import { MeterTariffResponseDto } from './dto/meter-tariff.response.dto';
import { ListMeterTariffsQueryDto } from './dto/list-meter-tariffs.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { CreateAreaTariffDto } from './dto/create-area-tariff.dto';
import { AreaTariffResponseDto } from './dto/area-tariff.response.dto';
import { ListAreaTariffsQueryDto } from './dto/list-area-tariffs.dto';

@ApiTags('tariffs')
@Controller('tariffs')
export class TariffController {
  constructor(private readonly tariffService: TariffService) {}

  @Post('meter-tariffs')
  @ApiOperation({
    summary: 'Create Meter tariff',
    description: 'Create a tariff for a single meter.',
  })
  @ApiCreatedResponse({
    description: 'The meter tariff has been successfully set.',
    type: Boolean,
  })
  createMeterTariff(@Body() createMeterTariffDto: CreateMeterTariffDto) {
    return this.tariffService.createMeterTariff(createMeterTariffDto);
  }

  @Get('meter-tariffs/:meterId')
  @ApiOperation({
    summary: 'List the tariffs of a meter',
    description:
      'Returns a paginated list of a meter tariffs based on the provided filters.',
  })
  @ApiParam({
    name: 'meterId',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiPaginatedResponse({ model: MeterTariffResponseDto })
  async listMeterTariffs(
    @Param('meterId') meterId: string,
    @Query() filter: ListMeterTariffsQueryDto,
  ): Promise<PaginatedResponseDto<MeterTariffResponseDto>> {
    return this.tariffService.listMeterTariff(meterId, filter);
  }

  @Post('area-tariffs')
  @ApiOperation({
    summary: 'Create Area tariff',
    description: 'Create a tariff for a single area.',
  })
  @ApiCreatedResponse({
    description: 'The area tariff has been successfully created.',
    type: Boolean,
  })
  createAreaTariff(@Body() createAreaTariffDto: CreateAreaTariffDto) {
    return this.tariffService.createAreaTariff(createAreaTariffDto);
  }

  @Get('area-tariffs/:areaId')
  @ApiOperation({
    summary: 'List the tariffs of an area',
    description:
      'Returns a paginated list of an area tariffs based on the provided filters.',
  })
  @ApiParam({
    name: 'areaId',
    description: 'The ID of the area',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiPaginatedResponse({ model: AreaTariffResponseDto })
  async listAreaTariffs(
    @Param('areaId') areaId: string,
    @Query() filter: ListAreaTariffsQueryDto,
  ): Promise<PaginatedResponseDto<AreaTariffResponseDto>> {
    return this.tariffService.listAreaTariffs(areaId, filter);
  }
}
