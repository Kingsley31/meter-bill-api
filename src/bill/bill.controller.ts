import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
