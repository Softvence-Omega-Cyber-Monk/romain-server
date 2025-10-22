// src/level/dto/update-level.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLevelDto {
  @ApiPropertyOptional({ example: 'Year 1 - Section A' })
  @IsOptional()
  @IsString()
  name?: string;
}