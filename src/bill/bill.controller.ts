import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BillService } from './bill.service';
import { AreaBillsGenerationRequest } from './bill-generation-request/dtos/generate-area-bills-request.dto';
import { BillGenerationResponse } from './bill-generation-request/dtos/bill-generation-request.response.dto';
import { AreaConsolidatedBillGenerationRequest } from './bill-generation-request/dtos/generate-area-consolidated-bill-request.dto';
import { CustomerConsolidatedBillGenerationRequest } from './bill-generation-request/dtos/generate-customer-consolidated-bill-request.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { BillGenrationRequestQueryDto } from './bill-generation-request/dtos/list-bill-generation-request.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { BillResponse } from './dtos/bill.response.dto';
import { ListBillQueryDto } from './dtos/list-bills.dto';
import { BillStatsResponseDto } from './dtos/bill-stats.response.dto';
import { BillStatsFilterDto } from './dtos/bill-stats-filter.dto';
import { ListBillBreakdownQueryDto } from './bill-breakdown/dtos/list-meter-reading-dto';
import { BillBreakdownResponseDto } from './bill-breakdown/dtos/bill-breakdowns.response.dto';
// import { Response } from 'express';

@ApiTags('bills')
@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post('area')
  @ApiOperation({
    description:
      'Create request to generate area bills, bills are generated asychronously.',
  })
  @ApiCreatedResponse({
    description:
      'generate area bill request created successfully, check the returned request status for updates on the bill generation progress.',
    type: BillGenerationResponse,
  })
  generateAreaBills(
    @Req() req: { user: { id: string; name: string } },
    @Body() body: AreaBillsGenerationRequest,
  ): Promise<BillGenerationResponse> {
    const user = req.user
      ? { requestedByUserId: req.user.id, requestedByUserName: req.user.name }
      : { requestedByUserId: 'd3d8e338dsds', requestedByUserName: 'Kingsley' };
    return this.billService.generateAreaBills({ ...body, ...user });
  }

  @Post('area-consolidated')
  @ApiOperation({
    description:
      'Create request to generate area consolidated bill, the bill is generated asychronously.',
  })
  @ApiCreatedResponse({
    description:
      'generate area consolidated bill request created successfully, check the returned request status for updates on the bill generation progress.',
    type: BillGenerationResponse,
  })
  generateAreaConsolidatedBill(
    @Req() req: { user: { id: string; name: string } },
    @Body() body: AreaConsolidatedBillGenerationRequest,
  ): Promise<BillGenerationResponse> {
    const user = req.user
      ? { requestedByUserId: req.user.id, requestedByUserName: req.user.name }
      : { requestedByUserId: 'd3d8e338dsds', requestedByUserName: 'Kingsley' };
    return this.billService.generateAreaConsolidatedBill({ ...body, ...user });
  }

  @Post('customer-consolidated')
  @ApiOperation({
    description:
      'Create request to generate customer consolidated bill, the bill is generated asychronously.',
  })
  @ApiCreatedResponse({
    description:
      'generate customer consolidated bill request created successfully, check the returned request status for updates on the bill generation progress.',
    type: BillGenerationResponse,
  })
  generateCustomerConsolidatedBill(
    @Req() req: { user: { id: string; name: string } },
    @Body() body: CustomerConsolidatedBillGenerationRequest,
  ): Promise<BillGenerationResponse> {
    const user = req.user
      ? { requestedByUserId: req.user.id, requestedByUserName: req.user.name }
      : { requestedByUserId: 'd3d8e338dsds', requestedByUserName: 'Kingsley' };
    return this.billService.generateCustomerConsolidatedBill({
      ...body,
      ...user,
    });
  }

  @Get()
  @ApiOperation({
    description: 'list bills.',
  })
  @ApiPaginatedResponse({ model: BillResponse })
  async listBills(
    @Query() filter: ListBillQueryDto,
  ): Promise<PaginatedResponseDto<BillResponse>> {
    return this.billService.listBills(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get bill by ID',
    description: 'Returns a bill.',
  })
  @ApiOkResponse({
    description: 'The bill have been successfully retrieved.',
    type: BillResponse,
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the bill',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  async getBillById(@Param('id') id: string): Promise<BillResponse> {
    return this.billService.getBillById({ billId: id });
  }

  @Get('generation-requests')
  @ApiOperation({
    description: 'list bill generation requests.',
  })
  @ApiPaginatedResponse({ model: BillGenerationResponse })
  async listBillGenerationRequest(
    @Query() filter: BillGenrationRequestQueryDto,
  ): Promise<PaginatedResponseDto<BillGenerationResponse>> {
    return this.billService.listBillGenerationRequests(filter);
  }

  @Get('/stats')
  @ApiOperation({
    summary: 'Get bill statistics',
    description: 'Returns statistics about the bills in the system.',
  })
  @ApiOkResponse({
    description: 'The meter statistics have been successfully retrieved.',
    type: BillStatsResponseDto,
  })
  async getBillStats(
    @Query() query: BillStatsFilterDto,
  ): Promise<BillStatsResponseDto> {
    return this.billService.getBillStats(query);
  }

  @Get(':id/breakdowns')
  @ApiOperation({
    summary: 'List the breakdowns of a bill',
    description:
      'Returns a paginated list of a bill breakdown based on the provided filters.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the bill',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiPaginatedResponse({ model: BillBreakdownResponseDto })
  async listBillBreakdowns(
    @Param('id') id: string,
    @Query() filter: ListBillBreakdownQueryDto,
  ): Promise<PaginatedResponseDto<BillBreakdownResponseDto>> {
    return this.billService.listBillBreakdowns(id, filter);
  }
}
