import { Controller, Post, Body, Req,  Res, HttpStatus, Patch, Param, Get, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto'; 
import { SystemRole } from '@prisma/client';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import sendResponse from '../utils/sendResponse';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger'; // <-- NEW IMPORTS
import { Public } from 'src/common/decorators/public.decorators';
import { ActivateAccountDto } from '../auth/dto/activate-account.dto';
import { UserService } from '../user/user.service';
import { ManualStatusUpdateDto } from './dto/student-status-update.dto';
import { GetStudentsDto } from './dto/get-students.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Student Enrollment (General Manager)')
@Controller('student')
export class StudentController {
    constructor(
        private readonly studentService: StudentService,
        private readonly userService: UserService,
    ) {}

    @Post('enroll')
    @Roles(SystemRole.GENERAL_MANAGER) 
    @ApiOperation({ summary: 'GM: Enroll a single new student, creating their profile, user account, and sending the activation email.' })
    @ApiBody({ type: CreateStudentDto }) 
    async enrollStudent(
        @Body() dto: CreateStudentDto,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const institutionId = req.user!.institutionId; 
        
        // Transactional enrollment: Student, User, and Debt records are created.
        const result = await this.studentService.enrollSingleStudent(institutionId, dto);

       
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


    @Post('activate')
    @Public() 
    @ApiOperation({ summary: 'STUDENT: Active student account by changing password' })
    async activateAccount(@Body() dto: ActivateAccountDto, @Res() res: Response) {
        
        const { userId, token, newPassword } = dto;
        const activatedUser = await this.userService.activateAccount(
            userId, 
            token, 
            newPassword
        );

        return sendResponse(res, {
            statusCode: HttpStatus.OK,
            success: true,
            message: 'Account successfully activated!. You can login the mobile app now.',
            data: { 
                email: activatedUser
            },
        });
    }

    
    @Get( )
    @Roles(SystemRole.GENERAL_MANAGER)
    @ApiOperation({ summary: 'GM: Fetch all students with pagination, searching (name, email), and filtering (Student ID, Level, Status).' })
    @ApiResponse({ status: 200, description: 'Paginated list of student profiles.' })
    async getAllStudents(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: GetStudentsDto, // Use the query DTO for validation
    ) {
        const institutionId = req.user!.institutionId;

        const studentsData = await this.studentService.findAllStudents(institutionId, query);

        return sendResponse(res, {
            statusCode: HttpStatus.OK,
            success: true,
            message: 'Students retrieved successfully.',
            data: studentsData
        });
    }

  
  @Get('profile')
  @Roles(SystemRole.STUDENT) // Only students can access their own profile
  @ApiOperation({ summary: 'Student: Retrieve the logged-in student\'s full academic and personal profile.' })
  @ApiResponse({ status: 200, description: 'Student profile retrieved successfully.' })
  async findMyProfile(@Req() req: Request, @Res() res: Response) {
      // The user object is attached to the request by the AuthGuard/JWT Strategy
      const userId = req.user!.id; 

      const profile = await this.studentService.findMyProfile(userId);

      return sendResponse(res, {
          statusCode: HttpStatus.OK,
          success: true,
          message: 'Student profile retrieved successfully.',
          data: profile,
      });
  }




    @Patch('status/manual/:studentId')
    @Roles(SystemRole.GENERAL_MANAGER) // Only GMs can use this
    @ApiOperation({ 
        summary: 'GM: Manually activate or deactivate a student account using their Student ID.',
        description: 'Used for student accounts where the activation link expired or was lost. Sets account status to Active or Inactive.'
    })
    @ApiParam({ name: 'studentId', description: 'The unique Student ID (e.g., UNI-25-CSE-0001).' })
    @ApiBody({ type: ManualStatusUpdateDto, description: 'The desired status (true/false) and the user ID linked to the student profile.' })
    async manualActivateDeactivate(
        @Param('studentId') studentId: string,
        @Body() dto: ManualStatusUpdateDto,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Use institutionId for scoped access control
        const institutionId = req.user!.institutionId;
        
        // This method will find the user associated with the studentId and set the status
        const updatedUser = await this.userService.manuallySetAccountStatus(
            institutionId, 
            studentId, 
            dto.isActive
        );

        const statusMessage = updatedUser.isActive ? 'activated' : 'deactivated';

        return sendResponse(res, {
            statusCode: HttpStatus.OK,
            success: true,
            message: `Account for Student ID ${studentId} successfully ${statusMessage}.`,
            data: { userId: updatedUser.id, email: updatedUser.email, isActive: updatedUser.isActive },
        });
    }



    @Post('enroll/bulk')
    @Roles(SystemRole.GENERAL_MANAGER)
    @UseInterceptors(FileInterceptor('file')) // Key: 'file' is the field name in the form data
    @ApiOperation({ summary: 'GM: Bulk enroll students via CSV file upload with asynchronous email queuing.' })
    @ApiConsumes('multipart/form-data') // Required for file upload in Swagger
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'CSV file containing student data (firstName, lastName, email, currentLevelId, currentSessionId)',
                },
            },
        },
    })
    async bulkEnrollStudents(
        @UploadedFile() file: Express.Multer.File, // The uploaded file buffer
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (!file || file.mimetype !== 'text/csv') {
            throw new BadRequestException('Please upload a valid CSV file.');
        }

        const institutionId = req.user!.institutionId;

        // The service handles the parsing, transaction, and email queuing
        const result = await this.studentService.bulkEnrollStudents(institutionId, file.buffer);

        const message = result.successfulEnrollments === result.totalRecords
            ? `Successfully enrolled ${result.successfulEnrollments} students. Activation emails are being sent.`
            : `Bulk enrollment completed with ${result.successfulEnrollments} successful records and ${result.failedEnrollments} failures.`;

        return sendResponse(res, {
            statusCode: HttpStatus.OK,
            success: true,
            message: message,
            data: result, // Returns the full summary (success count, failures array)
        });
    }


}