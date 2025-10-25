// src/student/dto/get-students.dto.ts

import { IsOptional, IsNumber, IsString, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetStudentsDto {
    @ApiProperty({ required: false, default: 1, description: 'Page number for pagination.' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page: number = 1;

    @ApiProperty({ required: false, default: 20, description: 'Number of items per page.' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    limit: number = 20;

    @ApiProperty({ required: false, description: 'General search term for student first name, last name, or email.' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({ required: false, description: 'Exact filter by Student ID (registrationNumber).' })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ required: false, description: 'Filter by current Level ID.' })
    @IsOptional()
    @IsString()
    currentLevelId?: string;

    @ApiProperty({ required: false, description: 'Filter by Student Status (e.g., ACTIVE, ON_HOLD).' })
    @IsOptional()
    @IsString()
    status?: string;
}