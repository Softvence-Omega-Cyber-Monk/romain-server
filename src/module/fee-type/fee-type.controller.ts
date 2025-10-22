// src/fee-type/fee-type.controller.ts
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
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import sendResponse from '../utils/sendResponse';
import { FeeTypeService } from './fee-type.service';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';


@ApiTags('Fee Types (General Manager)')
@Controller('fee-type')
@Roles(SystemRole.GENERAL_MANAGER)
export class FeeTypeController {
  constructor(private feeTypeService: FeeTypeService) {}

  @Post()
  @ApiOperation({ summary: 'GM: Create a new institution-wide fee category (e.g., Tuition Fee).' })
  @ApiBody({ type: CreateFeeTypeDto })
  async create(
    @Body() dto: CreateFeeTypeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.feeTypeService.create(req.user!.institutionId, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Fee Type created successfully.',
      data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'GM: Get all fee categories for the institution.' })
  async findAll(@Req() req:Request, @Res() res: Response) {
    const data = await this.feeTypeService.findAll(req.user!.institutionId);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Fee Types retrieved successfully.',
      data,
    });
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'GM: Update a fee category name or description.' })
  @ApiBody({ type: UpdateFeeTypeDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeeTypeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.feeTypeService.update(req.user!.institutionId, id, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Fee Type updated successfully.',
      data,
    });
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'GM: Delete a fee category (only if no prices are configured using it).' })
  async delete(@Param('id') id: string, @Req() req:Request, @Res() res: Response) {
    const data = await this.feeTypeService.delete(req.user!.institutionId, id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: data.message,
      data: null,
    });
  }

  
}