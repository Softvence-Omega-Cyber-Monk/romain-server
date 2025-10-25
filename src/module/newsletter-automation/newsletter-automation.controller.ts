import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { NewsletterAutomationService } from './newsletter-automation.service';
import { CreateNewsletterAutomationDto } from './dto/create-newsletter-automation.dto';
import sendResponse from '../utils/sendResponse';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorators';

@Controller('campaign')
export class NewsletterAutomationController {
  constructor(private readonly newsletterAutomationService: NewsletterAutomationService) {}

  @Post()
  @Public()
  async create(@Body() 
                 createNewsletterAutomationDto: CreateNewsletterAutomationDto,
               @Req() req: Request,
               @Res() res: Response,
               ) {
    const data = await this.newsletterAutomationService.createNewsletterCampaign(createNewsletterAutomationDto);
    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Campaign created successfully.',
      data,
    });
  }
@Get()
@Public()
async findAll(@Req() req: Request,
        @Res() res: Response,) {
  const data = await this.newsletterAutomationService.allNewsletterCampaign();
  return sendResponse(res, {
    statusCode: HttpStatus.CREATED,
    success: true,
    message: 'Campaign retrieve successfully.',
    data,
  });
}
}
//
// @Get()
// findAll() {
//   return this.newsletterAutomationService.findAll();
// }
//
// @Get(':id')
// findOne(@Param('id') id: string) {
//   return this.newsletterAutomationService.findOne(+id);
// }
//
// @Patch(':id')
// update(@Param('id') id: string, @Body() updateNewsletterAutomationDto: UpdateNewsletterAutomationDto) {
//   return this.newsletterAutomationService.update(+id, updateNewsletterAutomationDto);
// }
//
// @Delete(':id')
// remove(@Param('id') id: string) {
//   return this.newsletterAutomationService.remove(+id);
// }