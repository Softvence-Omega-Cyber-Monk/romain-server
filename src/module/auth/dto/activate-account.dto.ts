// src/auth/dto/activate-account.dto.ts
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateAccountDto {
    @ApiProperty({ description: 'The UUID of the User profile to activate (from URL param or hidden field).' })
    @IsNotEmpty()
    @IsUUID()
    userId: string;
    
    @ApiProperty({ description: 'The unique token sent to the user\'s email (from URL query).' })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ description: 'The new permanent password the student is setting.' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    newPassword: string; 
}