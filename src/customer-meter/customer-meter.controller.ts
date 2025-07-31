import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CustomerMeterSevice } from './customer-meter.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AssignMeterToCustomerDto } from './dtos/assign-meter-to-customer.dto';
import { PaginatedResponseDto } from 'src/common/dtos/paginated-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response';
import { CustomerMeterResponseDto } from './dtos/customer-meter.response.dto';
import { ListMeterCustomerQueryDto } from './dtos/list-meter-customers.dto';

@ApiTags('customer-meters')
@Controller('customer-meters')
export class CustomerMeterController {
  constructor(private readonly customerMeterService: CustomerMeterSevice) {}

  @Post('assign')
  @ApiOperation({
    summary: 'Assign a meter to a customer',
    description: 'Assigns a meter to a customer using the provided details.',
  })
  @ApiOkResponse({
    description: 'Meter successfully assigned to customer.',
    type: Boolean,
  })
  async assignMeterToCustomer(@Body() body: AssignMeterToCustomerDto) {
    return this.customerMeterService.assignMeterToCustomer(body);
  }

  @Get(':meterId/customers')
  @ApiOperation({
    summary: 'List customers assigned to a meter',
    description:
      'Returns a paginated list of customers assigned to a meter based on the provided filters.',
  })
  @ApiPaginatedResponse({ model: CustomerMeterResponseDto })
  async listMeterCustomers(
    @Param('meterId') meterId: string,
    @Query() filter: ListMeterCustomerQueryDto,
  ): Promise<PaginatedResponseDto<CustomerMeterResponseDto>> {
    return this.customerMeterService.listMeterCustomers(meterId, filter);
  }

  @Delete(':meterId/customers/:customerId')
  @ApiOperation({
    summary: 'Change meter status',
    description: 'Updates the status of a meter to active or inactive.',
  })
  @ApiOkResponse({
    description: 'The meter status has been successfully updated.',
    type: Boolean,
  })
  @ApiParam({
    name: 'meterId',
    description: 'The ID of the meter',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  @ApiParam({
    name: 'customerId',
    description: 'The ID of the customer',
    type: String,
    example: 'f7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  deleteMeterCustomer(
    @Param('meterId') meterId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customerMeterService.deleteMeterCustomer({
      meterId,
      customerId,
    });
  }
}
