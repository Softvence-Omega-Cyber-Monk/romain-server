// src/fee-type/dto/update-fee-type.dto.ts
import { IsString, IsOptional, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeeTypeDto {
  @ApiPropertyOptional({ example: 'Annual Tuition Fee' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiPropertyOptional({ example: 'Core academic instruction cost.' })
  @IsOptional()
  @IsString()
  description?: string;
}