import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAreaBankDetailsDto {
  @ApiProperty({
    type: String,
    description: 'Bank Account Name.',
    example: 'Ufoegbulam Chukwuemeka Kingsley',
  })
  @IsString()
  @IsNotEmpty()
  bankAccountName: string;

  @ApiProperty({
    type: String,
    description: 'Bank Account Name.',
    example: '0792007454',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  bankAccountNumber: string;

  @ApiProperty({
    type: String,
    description: 'Bank Name.',
    example: 'Access Bank',
  })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({
    type: String,
    description: 'Bank Code.',
    example: '022',
    required: false,
  })
  @IsString()
  @IsOptional()
  bankCode: string | null;
}
