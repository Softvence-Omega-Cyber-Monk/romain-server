import { Module } from '@nestjs/common';
import { NewsletterAutomationService } from './newsletter-automation.service';
import { NewsletterAutomationController } from './newsletter-automation.controller';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../../prisma/prisma.service';
@Module({
  imports: [MailModule],
  controllers: [NewsletterAutomationController],
  providers: [NewsletterAutomationService,PrismaService],
})
export class NewsletterAutomationModule {}
