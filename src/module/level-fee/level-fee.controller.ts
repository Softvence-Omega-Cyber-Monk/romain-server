// src/level-fee/level-fee.controller.ts
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
import { LevelFeeService } from './level-fee.service';
import { CreateLevelFeeDto } from './dto/create-level-fee.dto';
import { UpdateLevelFeeDto } from './dto/update-level-fee.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';


@ApiTags('Level Fee Pricing (General Manager)')
@Controller('level-fee')
@Roles(SystemRole.GENERAL_MANAGER)
export class LevelFeeController {
  constructor(private levelFeeService: LevelFeeService) {}

  @Post()
  @ApiOperation({ summary: 'GM: Set the price for a FeeType on a specific Level.' })
  @ApiBody({ type: CreateLevelFeeDto })
  async create(
    @Body() dto: CreateLevelFeeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelFeeService.create(req.user!.institutionId, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: `Price of ${data.amount} set successfully for ${data.feeType.name} on ${data.level.name}.`,
      data,
    });
  }

  @Get('level/:levelId')
  @ApiOperation({ summary: 'GM: Get the complete list of fees and amounts assigned to a specific Level.' })
  async getFeesByLevel(
    @Param('levelId') levelId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelFeeService.getFeesByLevel(req.user!.institutionId, levelId);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Level fee breakdown retrieved successfully.',
      data,
    });
  }
  
  @Patch(':levelId/:feeTypeId')
  @ApiOperation({ summary: 'GM: Update the price of an existing FeeType for a specific Level.' })
  @ApiBody({ type: UpdateLevelFeeDto })
  async updatePrice(
    @Param('levelId') levelId: string,
    @Param('feeTypeId') feeTypeId: string,
    @Body() dto: UpdateLevelFeeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelFeeService.updatePrice(req.user!.institutionId, levelId, feeTypeId, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Price updated to ${data.amount} for ${data.feeType.name}.`,
      data,
    });
  }
  
  @Delete(':levelId/:feeTypeId')
  @ApiOperation({ summary: 'GM: Delete a fee price assignment (only if no students have been invoiced).' })
  async deletePrice(
    @Param('levelId') levelId: string,
    @Param('feeTypeId') feeTypeId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.levelFeeService.deletePrice(req.user!.institutionId, levelId, feeTypeId);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: data.message,
      data: null,
    });
  }
}