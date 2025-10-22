
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import sendResponse from '../utils/sendResponse';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto'; // <-- Added
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';



@ApiTags('Academic Levels (General Manager)')
@Controller('level')
@Roles(SystemRole.GENERAL_MANAGER)
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Post()
  @ApiOperation({ summary: 'GM: Create a new Level (class/grade) under an existing Programme.' })
  @ApiBody({ type: CreateLevelDto })
  async create(
    @Body() dto: CreateLevelDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelService.create(req.user!.institutionId, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Academic Level created successfully.',
      data,
    });
  }


@Get('programme/:programmeId')
  @ApiOperation({ summary: 'GM: Get all Levels associated with a specific Programme.' })
  async getProgrammeLevels(
    @Param('programmeId') programmeId: string,
    @Req() req:Request,
     @Res() res: Response,
  ){
      const result=await this.levelService.getProgrammeLevels(req.user!.institutionId, programmeId)
  return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Levels retrieved successfully.',
      data:result,
    });
    }


  // NEW ENDPOINT: UPDATE
  @Patch(':id')
  @ApiOperation({ summary: 'GM: Update a Level (class name).' })
  @ApiBody({ type: UpdateLevelDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLevelDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelService.updateLevel(req.user!.institutionId, id, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Academic Level updated successfully.',
      data,
    });
  }
  
  // NEW ENDPOINT: DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'GM: Delete a Level (only if it has no students or fees linked).' })
  async delete(@Param('id') id: string, @Req() req:Request, @Res() res: Response) {
    const data = await this.levelService.deleteLevel(req.user!.institutionId, id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: data.message,
      data: null,
    });
  }

  
}