// src/programme/dto/update-programme.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgrammeDto {
  @ApiPropertyOptional({ example: 'BSc Computer Science (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  
   @ApiPropertyOptional({ example: 'CSE', description: 'code of the academic programme (CSE,EEE,ME etc).' })
   @IsOptional()
    @IsString()
    code: string;
}