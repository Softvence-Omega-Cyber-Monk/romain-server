// src/student/dto/bulk-enroll-result.dto.ts

import { ApiProperty } from '@nestjs/swagger';

// --- Interface for Failed Records ---
class FailedEnrollmentRecord {
    @ApiProperty({ description: 'The row number in the CSV file where the error occurred (1-indexed, typically starting from row 2 due to headers).', example: 15 })
    row: number;

    @ApiProperty({ description: 'The specific reason the record failed (e.g., Email already exists, Invalid Level ID).', example: 'Email already exists in the system.' })
    reason: string;
}


// --- Main Result DTO ---
export class BulkEnrollResultDto {
    @ApiProperty({ description: 'Total number of records found in the uploaded CSV file (excluding the header row).', example: 500 })
    totalRecords: number;

    @ApiProperty({ description: 'Number of student records that were successfully created and committed to the database.', example: 495 })
    successfulEnrollments: number;

    @ApiProperty({ description: 'Number of student records that failed validation or caused a transaction rollback.', example: 5 })
    failedEnrollments: number;

    @ApiProperty({ type: [FailedEnrollmentRecord], description: 'A detailed array listing the row number and reason for every failed enrollment.', example: [
        { row: 2, reason: 'Email already exists in the system.' },
        { row: 105, reason: 'Missing mandatory fields (currentLevelId).' },
    ]})
    failures: FailedEnrollmentRecord[];
}