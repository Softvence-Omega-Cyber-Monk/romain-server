// src/auth/dto/activate-account.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateAccountDto {
    @ApiProperty({ description: 'The temporary password received in the activation email.' })
    @IsNotEmpty()
    @IsString()
    oldPassword: string; // The temporary password

    @ApiProperty({ description: 'The student\'s new, permanent password.' })
    @IsNotEmpty()
    @IsString()
    newPassword: string; // The final password
}