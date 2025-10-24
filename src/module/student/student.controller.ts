// src/student/student.controller.ts

import { Controller, Post, Body, Req,  Res, HttpStatus } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto'; 
import { SystemRole } from '@prisma/client';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import sendResponse from '../utils/sendResponse';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'; // <-- NEW IMPORTS

@ApiTags('Student Enrollment (General Manager)') // <-- API TAG
@Controller('student')
export class StudentController {
    constructor(
        private readonly studentService: StudentService,
    ) {}

    @Post('enroll')
    @Roles(SystemRole.GENERAL_MANAGER) // Only GMs can enroll new students
    @ApiOperation({ summary: 'GM: Enroll a single new student, creating their profile, user account, and sending the activation email.' }) // <-- API OPERATION
    @ApiBody({ type: CreateStudentDto }) 
    async enrollStudent(
        @Body() dto: CreateStudentDto,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const institutionId = req.user!.institutionId; 
        
        // Transactional enrollment: Student, User, and Debt records are created.
        const result = await this.studentService.enrollStudent(institutionId, dto);

       
        return sendResponse(res, {
            statusCode: HttpStatus.CREATED,
            success: true,
            message: `Student ${result.studentId} enrolled successfully. Activation email sent to ${result.user.email}.`,
            data: { 
                studentId: result.studentId, 
                userId: result.user.id
            },
        });
    }
}