// src/programme/dto/create-programme.dto.ts
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProgrammeDto {
  @ApiProperty({ example: 'BSc Computer Science', description: 'Name of the academic programme (e.g., Degree, Course, or Major).' })
  @IsNotEmpty()
  @IsString()
  name: string;
  
  // This is the crucial foreign key that links the Programme to the active academic year.
  @ApiProperty({ description: 'UUID of the academic Session (created in Step 1) this programme belongs to.' })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;
}