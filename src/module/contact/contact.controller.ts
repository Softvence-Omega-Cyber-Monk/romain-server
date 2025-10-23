import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactFilterDto, UpdateContactDto } from './dto/update-contact.dto';
import { Public } from 'src/common/decorators/public.decorators';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('contact us')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public create endpoint
  @Post()
  @Public()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateContactDto) {
    const created = await this.contactService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Message received. Our team will contact you shortly.',
      data: created,
    };
  }

  // Admin: list (protect with guards in production)
  @Get()
  async findAll(@Query() query: ContactFilterDto) {
    const skip = query.skip ? Number(query.skip) : undefined;
    const take = query.take ? Number(query.take) : undefined;
    const result = await this.contactService.findAll({ skip, take, status: query.status });
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Contact messages fetched',
      data: result,
    };
  }

  // Admin: get one
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.contactService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Contact message fetched',
      data: item,
    };
  }

// Admin: update
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    const updated = await this.contactService.update(id,dto);//this.service.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Contact message updated',
      data: updated,
    };
  }

// Admin: delete
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const removed = await this.contactService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Contact message removed',
      data: removed,
    };
  }
}
