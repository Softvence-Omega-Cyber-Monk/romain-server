// src/fee-type/dto/create-fee-type.dto.ts
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeeTypeDto {
  @ApiProperty({ example: 'Tuition Fee', description: 'The name of the fee category.' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({ example: 'Core cost for academic instruction.', description: 'Brief description of the fee (optional).', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}