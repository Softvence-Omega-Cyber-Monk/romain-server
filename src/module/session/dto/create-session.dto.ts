// src/session/dto/create-session.dto.ts
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: '2025-2026 Academic Year' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '2025-09-01T00:00:00Z', description: 'Start date of the session' })
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @ApiProperty({ example: '2026-08-31T00:00:00Z', description: 'End date of the session' })
  @IsNotEmpty()
  @IsDateString()
  endDate: Date;
}