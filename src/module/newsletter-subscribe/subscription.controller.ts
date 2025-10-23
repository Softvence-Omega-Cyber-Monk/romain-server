import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  Res,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  SubscribeFilterDto,
  UnsubscribeDto,
  UpdateSubscriptionDto,
} from './dto/create-subscription.dto';
import { Public } from '../../common/decorators/public.decorators';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import sendResponse from '../../module/utils/sendResponse';
import { Response } from 'express';
import {MailService} from '../mail/mail.service';
@ApiTags('Newsletter Subscription')
@Controller('newsletter-subscribe')
@Public()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService,
              private readonly MailService: MailService) {}

  @Post('/')
  @ApiOperation({ summary: 'Public endpoint for subscription to request .' })
  @ApiBody({ type: CreateSubscriptionDto })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Res() res: Response) {
    const data = await this.subscriptionService.create(createSubscriptionDto);
    const email = data.email;
    await this.MailService.sendSubscriptionConfirmation(email);
    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Subscription request submitted.',
      data,
    });
  }

  @Get()
  async findAll(
    @Query() query: SubscribeFilterDto,
  ) {
    const skip = query.skip ? Number(query.skip) : undefined;
    const take = query.take ? Number(query.take) : undefined;
    const result = await this.subscriptionService.findAll({ skip, take, status: query.status });
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Subscriptions fetched',
      data: result,
    };
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.subscriptionService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Subscription fetched',
      data: item,
    };
  }

  // Update (admin)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    const updated = await this.subscriptionService.update(id, updateSubscriptionDto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Subscription updated',
      data: updated,
    };
  }
// Unsubscribe by email (public)
  @Post('unsubscribe')
  @Public()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    const updated = await this.subscriptionService.unsubscribe(dto.email);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'You have been unsubscribed successfully.',
      data: updated,
    };
  }
  // Delete (admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const removed = await this.subscriptionService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Subscription removed',
      data: removed,
    };
  }
}
