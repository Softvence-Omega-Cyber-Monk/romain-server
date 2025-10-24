// src/user/user.controller.ts

import { Controller, Param, Patch, Req, Res, HttpStatus, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { SystemRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Request } from 'express';
import sendResponse from '../utils/sendResponse';


// Assuming DTOs for password changes exist:
// import { ChangePasswordDto } from './dto/change-password.dto'; 

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    // --- A. STAFF FALLBACK: Manual Activation ---
    // @Patch('activate/manual/:studentId')
    // @Roles(SystemRole.GENERAL_MANAGER) // Only staff can use this
    // async manualActivate(
    //     @Param('studentId') studentId: string,
    //     @Req() req:Request,
    //     @Res() res: Response,
    // ) {
    //     // Use institutionId for scoped access control
    //     const institutionId = req.user!.institutionId;
        
    //     const data = await this.userService.manuallyActivateAccount(institutionId, studentId);

    //     return sendResponse(res, {
    //         statusCode: HttpStatus.OK,
    //         success: true,
    //         message: `Account for ${studentId} manually activated. Student can now log in with the temporary password.`,
    //         data: { userId: data.id, email: data.email },
    //     });
    // }
   
}