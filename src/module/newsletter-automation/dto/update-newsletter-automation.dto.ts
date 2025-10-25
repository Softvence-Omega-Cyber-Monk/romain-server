import { PartialType } from '@nestjs/swagger';
import { CreateNewsletterAutomationDto } from './create-newsletter-automation.dto';

export class UpdateNewsletterAutomationDto extends PartialType(CreateNewsletterAutomationDto) {}
