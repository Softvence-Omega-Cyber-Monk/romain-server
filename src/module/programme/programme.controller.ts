import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import sendResponse from '../utils/sendResponse';
import { ProgrammeService } from './programme.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';


@ApiTags('Academic Programmes (General Manager)')
@Controller('programme')
@Roles(SystemRole.GENERAL_MANAGER)
export class ProgrammeController {
  constructor(private programmeService: ProgrammeService) {}

  @Post()
  @ApiOperation({ summary: 'GM: Create a new Programme (Major/Course) and link it to an academic session.' })
  @ApiBody({ type: CreateProgrammeDto })
  async create(
    @Body() dto: CreateProgrammeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.programmeService.create(req.user!.institutionId, dto);
    
    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Programme created successfully.',
      data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'GM: Get all Programmes for the General Manager\'s institution.' })
  async getInstitutionProgrammes(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.programmeService.getInstitutionProgrammes(req.user!.institutionId);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Programmes retrieved successfully.',
      data,
    });
  }


  @Patch(':id')
  @ApiOperation({ summary: 'GM: Update a Programme (e.g., change its name).' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProgrammeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.programmeService.updateProgramme(req.user!.institutionId, id, dto);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Programme updated successfully.',
      data,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'GM: Delete a Programme (only if no Levels are linked).' })
  async delete(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.programmeService.deleteProgramme(req.user!.institutionId, id);
    
    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: data.message,
      data: null,
    });
  }
}