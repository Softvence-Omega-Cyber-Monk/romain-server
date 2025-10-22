import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiPropertyOptional({
    description: 'Full name of the person submitting the message',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Email address of the person submitting the message',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the contact person',
    example: '+1-202-555-0147',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Subject line of the message',
    example: 'Inquiry about service process',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Main message or inquiry content',
    example: 'I would like to know more about your service requirements.',
  })
  @IsString()
  @MinLength(5)
  message: string;
}

export enum ContactStatusEnum {
  NEW = 'NEW',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED',
}