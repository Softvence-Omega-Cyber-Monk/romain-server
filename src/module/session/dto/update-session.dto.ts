import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateSessionDto {
    @ApiPropertyOptional({ example: 'Updated 2025-2026 Session' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: '2025-09-15', description: 'Start date of the session (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: Date;

    @ApiPropertyOptional({ example: '2026-09-14', description: 'End date of the session (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: Date;
}