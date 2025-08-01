import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
import { UpdateMeterStatusDto } from './dtos/update-meter-status.dto';
import { UpdateMeterAreaDto } from './dtos/update-meter-area.dto';
import { SetMeterTariffDto } from './dtos/set-meter-tariff.dto';
import { CreateMeterReadingDto } from './dtos/create-meter-reading.dto';
import { MeterReadingResponseDto } from './dtos/meter-readings.response.dto';
import { ListMeterReadingQueryDto } from './dtos/list-meter-reading-dto';
import { MeterConsumptionChartDataResponse } from './dtos/mete-consumption-chart-data.response.dto';
import { MeterConsumpptionChartQuerDto } from './dtos/meter-consumption-chart-query.dto';
import { MeterTariffResponseDto } from './dtos/meter-tariff.response.dto';
import { ListMeterTariffsQueryDto } from './dtos/list-meter-tariffs.dto';
import { EditMeterReadingDto } from './dtos/edit-meter-reading.dto';
import { UpdateMeterBillDetailsDto } from './dtos/update-meter-bill-details.dto';

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

  @Get(':id')
  @ApiOperation({
    summary: 'Get meter by ID',
    description: 'Returns a meter.',
  })
  @ApiOkResponse({
    description: 'The meter have been successfully retrieved.',
    type: MeterResponseDto,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  async getMeterById(@Param('id') id: string): Promise<MeterResponseDto> {
    return this.meterService.getMeterById({ meterId: id });
  }

  @Get(':id/sub-meters')
  @ApiOperation({
    summary: 'List a derived meter sub meters',
    description: 'Returns a list of sub meters for a derived meter.',
  })
  @ApiOkResponse({
    description:
      'The derived meter sub meters have been successfully retrieved.',
    type: MeterResponseDto,
    isArray: true,
  })
  async listMeterSubMeters(
    @Param('id') id: string,
  ): Promise<MeterResponseDto[]> {
    return this.meterService.listMeterSubMeters(id);
  }

  @Get(':id/consumption-chart')
  @ApiOperation({
    summary: 'List consumption chart data for a meter',
    description: 'Returns a list of consumption chart data for a meter.',
  })
  @ApiOkResponse({
    description:
      'The meter consumption chart data have been successfully retrieved.',
    type: MeterConsumptionChartDataResponse,
    isArray: true,
  })
  async listMeterConsumptionChartData(
    @Param('id') id: string,
    @Query() filter: MeterConsumpptionChartQuerDto,
  ): Promise<MeterConsumptionChartDataResponse[]> {
    return this.meterService.listMeterConsumptionChartData(id, filter);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change meter status',
    description: 'Updates the status of a meter to active or inactive.',
  })
  @ApiOkResponse({
    description: 'The meter status has been successfully updated.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateMeterStatusDto: UpdateMeterStatusDto,
  ) {
    return this.meterService.updateStatus(id, updateMeterStatusDto);
  }

  @Patch(':id/area')
  @ApiOperation({
    summary: 'Assign Meter to an area',
    description:
      'Assigns a meter to a selected area and updates meter location.',
  })
  @ApiOkResponse({
    description: 'The meter area and location has been successfully updated.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  updateArea(
    @Param('id') id: string,
    @Body() updateMeterAreaDto: UpdateMeterAreaDto,
  ) {
    return this.meterService.updateArea(id, updateMeterAreaDto);
  }

  // @Patch(':id/customer')
  // @ApiOperation({
  //   summary: 'Assign Meter to a customer',
  //   description: 'Assigns a meter to a selected customer.',
  // })
  // @ApiOkResponse({
  //   description: 'The meter customer has been successfully updated.',
  //   type: Boolean,
  // })
  // @ApiParam({
  //   name: 'id',
  //   description: 'The ID of the meter',
  //   type: String,
  //   example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  // })
  // updateCustomer(
  //   @Param('id') id: string,
  //   @Body() updateMeterCustomerDto: UpdateMeterCustomerDto,
  // ) {
  //   return this.meterService.updateCustomer(id, updateMeterCustomerDto);
  // }

  @Patch(':id/tariff')
  @ApiOperation({
    summary: 'Set Meter tariff',
    description: 'Set a tariff for a single meter.',
  })
  @ApiOkResponse({
    description: 'The meter tariff has been successfully set.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  setTariff(
    @Param('id') id: string,
    @Body() setMeterTariffDto: SetMeterTariffDto,
  ) {
    return this.meterService.setTariff(id, setMeterTariffDto);
  }

  @Post(':id/readings')
  @ApiOperation({
    summary: 'Create a meter reading',
    description: 'Create the current reading of a meter.',
  })
  @ApiOkResponse({
    description: 'The meter reading has been successfully created.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  storeReading(
    @Param('id') id: string,
    @Body() createMeterReadingDto: CreateMeterReadingDto,
  ) {
    return this.meterService.createReading(id, createMeterReadingDto);
  }

  @Delete(':id/readings/:readingId')
  @ApiOperation({
    summary: 'Delete a meter reading',
    description: 'Delete reading of a meter that was entered today.',
  })
  @ApiOkResponse({
    description: 'The meter reading has been successfully deleted.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiParam({
    name: 'readingId',
    description: 'The ID of the meter reading',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  deleteReading(
    @Param('id') meterId: string,
    @Param('readingId') readingId: string,
  ) {
    return this.meterService.deleteMeterReading(meterId, readingId);
  }

  @Patch(':id/readings/:readingId')
  @ApiOperation({
    summary: 'Edit a meter reading',
    description: 'Edit reading of a meter.',
  })
  @ApiOkResponse({
    description: 'The meter reading has been successfully edited.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiParam({
    name: 'readingId',
    description: 'The ID of the meter reading',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  editReading(
    @Param('id') meterId: string,
    @Param('readingId') readingId: string,
    @Body() editMeterReadingDto: EditMeterReadingDto,
  ) {
    return this.meterService.editMeterReading(
      meterId,
      readingId,
      editMeterReadingDto,
    );
  }

  @Get(':id/readings')
  @ApiOperation({
    summary: 'List the readings of a meter',
    description:
      'Returns a paginated list of a meter readings based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: MeterReadingResponseDto })
  async listMeterReadings(
    @Param('id') id: string,
    @Query() filter: ListMeterReadingQueryDto,
  ): Promise<PaginatedResponseDto<MeterReadingResponseDto>> {
    return this.meterService.listMeterReadings(id, filter);
  }

  @Get(':id/tariffs')
  @ApiOperation({
    summary: 'List the tariffs of a meter',
    description:
      'Returns a paginated list of a meter tariffs based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: MeterTariffResponseDto })
  async listMeterTariffs(
    @Param('id') id: string,
    @Query() filter: ListMeterTariffsQueryDto,
  ): Promise<PaginatedResponseDto<MeterTariffResponseDto>> {
    return this.meterService.listMeterTariff(id, filter);
  }

  @Patch(':id/bill-details')
  @ApiOperation({
    summary: 'Update bill details of a meter',
    description: 'Updates the bill details of a meter.',
  })
  @ApiOkResponse({
    description: 'The meter bill details have been successfully updated.',
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  updateBillDetails(
    @Param('id') id: string,
    @Body() updateMeterBillDetailsDto: UpdateMeterBillDetailsDto,
  ) {
    return this.meterService.updateMeterLastBillDetails(
      id,
      updateMeterBillDetailsDto,
    );
  }
}
