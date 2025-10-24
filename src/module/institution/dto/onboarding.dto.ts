import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for the public onboarding request
export class OnboardInstitutionDto {
  // --- INSTITUTION FIELDS ---

  @ApiProperty({ example: 'University of NestJS', description: 'Full name of the institution.' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main Street, City', description: 'Physical address of the institution.' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'MIST', description: 'Prefix used for generating student registration numbers (e.g., UNIV-25-CS-0042).' })
  @IsNotEmpty()
  @IsString()
  prefix: string;

  @ApiProperty({ example: 'BNP Paribas', description: 'Name of the bank for disbursement.' })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the primary cardholder/account signatory.' })
  @IsNotEmpty()
  @IsString()
  cardHolder: string;

  @ApiProperty({ example: 'FR7630006000011234567890189', description: 'The RIB or IBAN number for bank transfers.' })
  @IsNotEmpty()
  @IsString()
  RIB_IBAN: string;

  @ApiProperty({ example: 'BNPAFRPPXXX', description: 'The BIC or SWIFT code for international transfers.' })
  @IsNotEmpty()
  @IsString()
  BIC_SWIFT: string;

  @ApiPropertyOptional({ example: 'https://docs.link/kyc-cert.pdf', description: 'URL or path to KYC documents (e.g., business registration certificate).' })
  @IsOptional()
  @IsUrl()
  KYC_documents?: string;

  // --- GENERAL MANAGER (USER) FIELDS ---

  @ApiProperty({ example: 'Jane', description: 'First name of the General Manager (initial admin user).' })
  @IsNotEmpty()
  @IsString()
  managerFirstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the General Manager (initial admin user).' })
  @IsNotEmpty()
  @IsString()
  managerLastName: string;

  @ApiProperty({ example: 'manager@institution.com', description: 'Email address of the General Manager (used for login).' })
  @IsNotEmpty({ message: 'Email is required for the manager' })
  @IsEmail({}, { message: 'Email must be valid' })
  managerEmail: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number of the General Manager.' })
  @IsOptional()
  @IsString()
  managerPhone?: string;

  @ApiProperty({
    example: '123456',
    description: 'Initial password for the General Manager account (min 8 characters).',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  managerPassword: string;
}