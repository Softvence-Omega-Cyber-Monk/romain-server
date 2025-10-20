import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  Query,
  BadRequestException
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorators';
import { SystemRole } from '@prisma/client';
import sendResponse from '../utils/sendResponse'; // Assuming this utility path
import { InstitutionService } from './institution.service';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { OnboardInstitutionDto } from './dto/onboarding.dto';

@ApiTags('Institution')
@Controller('institution')
export class InstitutionController {
  constructor(private institutionService: InstitutionService) {}

  @Post('onboarding-request')
  @Public() // This is the public landing page form, no auth required
  @ApiOperation({ summary: 'Public endpoint for institutions to request onboarding.' })
  @ApiBody({ type: OnboardInstitutionDto })
  async requestOnboarding(@Body() dto: OnboardInstitutionDto, @Res() res: Response) {
    const data = await this.institutionService.requestOnboarding(dto);
    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Institution request submitted. Awaiting Admin validation.',
      data,
    });
  }

  @Get('pending')
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN) // Platform Admins check pending requests
  @ApiOperation({ summary: 'Retrieve all institutions pending Super Admin validation.' })
  async getPendingInstitutions(@Res() res: Response) {
    const data = await this.institutionService.getPendingInstitutions();
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Pending institutions retrieved successfully.',
      data,
    });
  }

@Get()
@Roles(SystemRole.SUPER_ADMIN, SystemRole.ADMIN) // Restricted to Platform Admins
@ApiOperation({ summary: 'Retrieve all institutions with pagination.' })
@ApiQuery({
  name: 'page',
  required: false,
  example: 1,
  description: 'Page number (default: 1)',
})
@ApiQuery({
  name: 'limit',
  required: false,
  example: 10,
  description: 'Number of institutions per page (default: 10, max: 100)',
})
async getAllInstitutions(
  @Query('page') page: string = '1',
  @Query('limit') limit: string = '10',
  @Res() res: Response,
) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Validate and use reasonable defaults
  const validatedPage = pageNum > 0 ? pageNum : 1;
  const validatedLimit = limitNum > 0 && limitNum <= 100 ? limitNum : 10;

  const data = await this.institutionService.getAllInstitutions(validatedPage, validatedLimit);

  return sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Institutions retrieved successfully with pagination.',
    data,
  });
}


  @Patch('validate/:id')
  @Roles(SystemRole.SUPER_ADMIN,SystemRole.ADMIN) // Only Super Admin can finalize validation/rejection
  @ApiOperation({ summary: 'Super Admin action to approve (activate) or reject an institution.' })
  async validateInstitution(
    @Param('id') id: string,
    @Query('action') action: 'approve' | 'reject', // Use query parameter for clarity
    @Res() res: Response,
  ) {
    if (!['approve', 'reject'].includes(action)) {
        throw new BadRequestException('Action must be "approve" or "reject".');
    }

    const approve = action === 'approve';
    const result = await this.institutionService.validateInstitution(id, approve);
    
   

    return sendResponse(res, {
      statusCode: HttpStatus.OK ,
      success: true,
      message: result.message,
      data: result.institution || null,
    });
  }
}