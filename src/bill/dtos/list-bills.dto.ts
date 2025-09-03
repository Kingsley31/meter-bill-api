import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { BillGenerationRequestScope } from '../bill-generation-request/bill-generation-request.enums';

export class ListBillQueryDto {
  @ApiPropertyOptional({
    description: 'Date the bill was generation start(ISO 8601 format)',
    example: '2024-07-01T00:00:00.000Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  generatedStartDate?: Date | undefined;

  @ApiPropertyOptional({
    description: 'Date the bill was generated end (ISO 8601 format)',
    example: '2024-07-31T23:59:59.999Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @ValidateIf(
    (o: ListBillQueryDto) =>
      o.generatedStartDate !== undefined && o.generatedStartDate !== null,
  )
  @IsNotEmpty()
  @IsDateString()
  generatedEndDate?: Date | undefined;

  @ApiPropertyOptional({
    description: 'Search term for bill number, recipient name, or area name',
    example: 'John Doe',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string | undefined;

  @ApiPropertyOptional({
    description: 'Whether the bill is consolidated',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isConsolidated?: boolean | undefined;

  @ApiPropertyOptional({
    description: 'UUID of the area',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  areaId?: string | undefined;

  @ApiPropertyOptional({
    description: 'Scope of the bill generation request',
    enum: BillGenerationRequestScope,
    example: BillGenerationRequestScope.AREA_WIDE,
  })
  @IsOptional()
  @IsEnum(BillGenerationRequestScope)
  scope?: BillGenerationRequestScope;

  @ApiPropertyOptional({
    type: Number,
    description: 'Page number for pagination',
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    type: Number,
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  pageSize: number;
}
