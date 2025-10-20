import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Patch,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import sendResponse from '../utils/sendResponse'; // Assuming this utility path
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ApiTags, ApiOperation, ApiBody} from '@nestjs/swagger';


@ApiTags('Academic Sessions (General Manager)')
@Controller('session')
@Roles(SystemRole.GENERAL_MANAGER) // All routes require General Manager role
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post()
  @Roles(SystemRole.GENERAL_MANAGER)
  @ApiOperation({ summary: 'GM: Create a new academic session for the institution.' })
  @ApiBody({ type: CreateSessionDto })
  async create(
    @Body() dto: CreateSessionDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {

    const institutionId = req.user!.institutionId;

    const data = await this.sessionService.create(institutionId, dto);
    
    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Session created successfully. If an active session existed, this one is inactive.',
      data,
    });
  }

  @Get()
  @Roles(SystemRole.GENERAL_MANAGER)
  @ApiOperation({ summary: 'GM: Get all sessions for the General Manager\'s institution.' })
  async getInstitutionSessions(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const institutionId = req.user!.institutionId;

    const data = await this.sessionService.getInstitutionSessions(institutionId);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Sessions retrieved successfully.',
      data,
    });
  }

  @Patch('close/:id')
  @Roles(SystemRole.GENERAL_MANAGER)
  @ApiOperation({ summary: 'GM: Close the current active session (archives the year).' })
  async closeSession(
    @Param('id') id: string,
    @Req() req:Request,
    @Res() res: Response,
  ) {
    const institutionId = req.user!.institutionId;

    const data = await this.sessionService.closeSession(institutionId, id);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Session "${data.name}" successfully closed and archived.`,
      data,
    });
  }

  @Patch('activate/:id')
  @Roles(SystemRole.GENERAL_MANAGER)
  @ApiOperation({ summary: 'GM: Activate a previously created inactive session (automatically deactivates others).' })
  async activateSession(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {

    const institutionId = req.user!.institutionId;

    const data = await this.sessionService.activateSession(institutionId, id);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Session "${data.name}" successfully activated. All other sessions are now inactive.`,
      data,
    });
  }
}