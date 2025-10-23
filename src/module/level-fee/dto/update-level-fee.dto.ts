// src/level-fee/dto/update-level-fee.dto.ts
import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLevelFeeDto {
  @ApiPropertyOptional({ example: 5500.00, description: 'The new monetary amount.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}