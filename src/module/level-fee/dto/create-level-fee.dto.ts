// src/level-fee/dto/create-level-fee.dto.ts
import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLevelFeeDto {
  @ApiProperty({ description: 'UUID of the Level (e.g., Year 1 class)' })
  @IsNotEmpty()
  @IsUUID()
  levelId: string;

  @ApiProperty({ description: 'UUID of the FeeType (e.g., Tuition Fee)' })
  @IsNotEmpty()
  @IsUUID()
  feeTypeId: string;

  @ApiProperty({ example: 5250.00, description: 'The monetary amount for this specific fee on this specific level.' })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}