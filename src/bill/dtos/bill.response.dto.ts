import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BillRecipient {
  @ApiProperty({
    description: 'Unique identifier for the bill recipient',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the bill recipient',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Phone number of the bill recipient',
    example: '+2348012345678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Email address of the bill recipient',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Unique identifier for the bill',
    format: 'uuid',
    example: 'b1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  billId: string;

  @ApiProperty({
    description: 'Whether the bill has been sent to the recipient',
    example: true,
  })
  billSent: boolean;

  @ApiProperty({
    description: 'Date the bill recipient record was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the bill recipient record was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;
}

export class BillResponse {
  @ApiProperty({
    description: 'Unique identifier for the bill',
    format: 'uuid',
    example: 'c1b2c3d4-e5f6-7890-abcd-1234567890ef',
  })
  id: string;

  @ApiProperty({
    description: 'Invoice number for the bill',
    example: 'INV-2024-0001',
  })
  invoiceNumber: string;

  @ApiProperty({
    description: 'Request ID associated with the bill generation',
    example: 'REQ-123456',
  })
  requestId: string;

  @ApiProperty({
    description: 'User ID of the user who generated the bill',
    format: 'uuid',
    example: 'e8b9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
  })
  generateByUserId: string;

  @ApiProperty({
    description: 'Username of the user who generated the bill',
    example: 'john.doe',
  })
  generateByUserName: string;

  @ApiProperty({
    description: 'Whether the PDF for the bill has been generated',
    example: true,
  })
  pdfGenerated: boolean;

  @ApiPropertyOptional({
    description: 'URL to the generated PDF of the bill',
    example: 'https://example.com/bills/invoice-2024-0001.pdf',
    nullable: true,
  })
  pdfUrl: string | undefined;

  @ApiProperty({
    description: 'Total amount due for the bill',
    type: Number,
    example: 150000.0,
  })
  totalAmountDue: number;

  @ApiProperty({
    description: 'Whether the bill is consolidated',
    example: false,
  })
  isConsolidated: boolean;

  @ApiProperty({
    description: 'Start date for the bill period',
    type: String,
    format: 'date-time',
    example: '2024-07-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date for the bill period',
    type: String,
    format: 'date-time',
    example: '2024-07-31T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Type of the bill recipient',
    example: 'customer',
  })
  recipientType: string;

  @ApiProperty({
    description: 'Scope of the bill generation',
    example: 'area-wide',
  })
  scope: string;

  @ApiPropertyOptional({
    description: 'UUID of the area associated with the bill',
    format: 'uuid',
    example: 'd7a9e2e1-8c2d-4e3a-9c2d-1e2a3b4c5d6f',
    nullable: true,
  })
  areaId?: string | undefined;

  @ApiPropertyOptional({
    description: 'Name of the area associated with the bill',
    example: 'Lagos Mainland',
    nullable: true,
  })
  areaName?: string | undefined;

  @ApiProperty({
    description: 'Payment status of the bill',
    example: 'pending',
  })
  paymentStatus: string;

  @ApiProperty({
    description: 'Date the bill was created',
    type: String,
    format: 'date-time',
    example: '2024-07-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the bill was last updated',
    type: String,
    format: 'date-time',
    example: '2024-07-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'List of recipients for the bill',
    type: () => BillRecipient,
    isArray: true,
  })
  billRecipients: BillRecipient[];
}
