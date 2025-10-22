import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';


export class CreateSubscriptionDto {

  @ApiProperty({
    example: 'subscribe@example.com',
    description: 'Email address of the subscribe',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;
}
export class SubscribeFilterDto {
  @ApiPropertyOptional({
    description: 'Skip number of records (for pagination)',
    example: 0,
  })
  @IsOptional()
  @IsNumberString()
  skip?: string;

  @ApiPropertyOptional({
    description: 'Limit number of records returned (for pagination)',
    example: 10,
  })
  @IsOptional()
  @IsNumberString()
  take?: string;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    description: 'Filter by subscription status (ACTIVE or UNSUBSCRIBED)',
    example: SubscriptionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
export class UnsubscribeDto {
  @IsEmail()
  email: string;
}
export enum SubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}
