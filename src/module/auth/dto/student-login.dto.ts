// src/auth/dto/student-login.dto.ts

import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentLoginDto {
    @ApiProperty({ 
        description: 'The Student ID (e.g., UNI-25-CSE-0001).',
        example: 'UNI-25-CSE-0001', // 💡 EXAMPLE ADDED
    })
    @IsNotEmpty()
    @IsString()
    studentId: string;

    @ApiProperty({ 
        description: 'The student\'s password.',
        example: '12345678', 
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long.' })
    password: string;
}