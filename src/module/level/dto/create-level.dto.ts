// src/level/dto/create-level.dto.ts
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLevelDto {
  @ApiProperty({ example: 'Year 1', description: 'Name of the class/grade level (e.g., Year 1, M2, Grade 5).' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'UUID of the Programme this level belongs to (e.g., Science Degree).' })
  @IsNotEmpty()
  @IsUUID()
  programmeId: string;
}

