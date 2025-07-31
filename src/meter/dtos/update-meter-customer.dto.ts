import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';

export class UpdateMeterCustomerDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the customer to assign the meter to',
    example: 'c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    type: String,
    description: 'The name of the customer to assign the meter to',
    example: 'John Doe',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    type: Number,
    description: 'The total number of customers associated with the meter',
    example: 100,
  })
  @IsNumber()
  totalCustomers: number;
}
