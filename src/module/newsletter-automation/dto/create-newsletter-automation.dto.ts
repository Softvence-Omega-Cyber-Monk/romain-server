import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NewsletterStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateNewsletterAutomationDto {
  @ApiProperty({ example: 'Weekly School Newsletter' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your Weekly Update from Greenfield School 🌱' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: '<h1>Welcome!</h1><p>This week we launched a new library.</p>',
  })
  @IsString()
  @IsNotEmpty()
  html: string;

  @ApiPropertyOptional({
    enum: NewsletterStatus,
    default: NewsletterStatus.SCHEDULED,
  })
  @IsEnum(NewsletterStatus)
  @IsOptional()
  status?: NewsletterStatus = NewsletterStatus.SCHEDULED;

  @ApiPropertyOptional({
    example: '2025-10-26T06:00:00.000Z',
    description: 'If not provided, defaults to the current date/time.',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
