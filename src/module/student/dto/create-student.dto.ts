// src/student/dto/create-student.dto.ts

import { IsNotEmpty, IsString, IsEmail, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'student.new@mail.com', description: 'Student\'s email address (for communication/login help).' })
  @IsNotEmpty()
  @IsEmail()
  email: string;



  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'UUID of the academic Level (e.g., Year 1).' })
  @IsNotEmpty()
  @IsUUID()
  currentLevelId: string;

  @ApiProperty({ example: 'f9e8d7c6-b5a4-3f2e-1d0c-9b8a7f6e5d4c', description: 'UUID of the academic Session (e.g., Fall 2025).' })
  @IsNotEmpty()
  @IsUUID()
  currentSessionId: string;

  @ApiProperty({ example: 'Ali', description: 'Student\'s first name (optional, but good for user profile).' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Fahad', description: 'Student\'s last name (optional).' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}