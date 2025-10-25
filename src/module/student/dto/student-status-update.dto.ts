

import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualStatusUpdateDto {


    @ApiProperty({ description: 'The new activation status (true for activate, false for deactivate).' })
    @IsNotEmpty()
    @IsBoolean()
    isActive: boolean;
}