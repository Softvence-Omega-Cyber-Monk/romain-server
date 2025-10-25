import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';
import { CreateNewsletterAutomationDto } from './dto/create-newsletter-automation.dto';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffDelay(attempt: number, base = 1000, max = 30000) {
  const exp = Math.min(max, base * Math.pow(2, attempt - 1));
  const jitter = exp * (0.2 * (Math.random() - 0.5));
  return Math.max(200, Math.round(exp + jitter));
}

// Typed recipient structure NewsletterCampaign
interface Recipient {
  email: string;
  status: 'pending' | 'sent' | 'failed';
  attemptCount: number;
  error?: string;
  sentAt?: string;
}

// Typed campaign structure
interface NewsletterCampaignTyped {
  id: string;
  title: string;
  subject: string;
  html: string;
  recipients: Recipient[] | null;
}

@Injectable()
export class NewsletterAutomationService implements OnModuleInit {
  private readonly logger = new Logger(NewsletterAutomationService.name);
  private readonly batchSize = Number(process.env.BATCH_SIZE || 100);
  private readonly maxRetries = Number(process.env.MAX_RETRIES || 3);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `NewsletterAutomationService initialized. Cron: ${process.env.CRON_EXPRESSION || '0 6 * * *'}`,
    );
  }

  @Cron(process.env.CRON_EXPRESSION || '*/5 * * * *')
  async handleCron() {
    const now = new Date();
    const campaigns = await this.prisma.newsletterCampaign.findMany({
      where: {
        scheduledAt: { lte: now },
        status: 'SCHEDULED',
      },
    });

    if (campaigns.length === 0) {
      this.logger.log('No scheduled campaigns found.');
      return;
    }

    for (const c of campaigns) {
      const campaign = c as NewsletterCampaignTyped;

      this.logger.log(`Processing campaign "${campaign.title}" (${campaign.id})`);
      await this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING' },
      });

      try {
        await this.processCampaign(campaign);
        await this.prisma.newsletterCampaign.update({
          where: { id: campaign.id },
          data: { status: 'COMPLETED' },
        });
        this.logger.log(` Campaign "${campaign.title}" completed.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(` Campaign "${campaign.title}" failed: ${msg}`);
        await this.prisma.newsletterCampaign.update({
          where: { id: campaign.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }
// 0 6 * * *  || */5 * * * *
  private async processCampaign(campaign: NewsletterCampaignTyped) {
    const subscribers = await this.prisma.subscriptionEmail.findMany({
      where: { status: 'ACTIVE' },
    });

    this.logger.log(`Found ${subscribers.length} active subscribers.`);

    const recipients: Recipient[] = campaign.recipients ?? [];

    // duplicate recipients
    const sentEmails = new Set(recipients.map((r) => r.email));
    for (const s of subscribers) {
      if (!sentEmails.has(s.email)) {
        recipients.push({ email: s.email, status: 'pending', attemptCount: 0 });
      }
    }

    // Save recipients before sending
    await this.prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { recipients: recipients.length > 0 ? (recipients as unknown as Prisma.InputJsonValue) : [] },
    });


    // Batch sending
    for (let i = 0; i < recipients.length; i += this.batchSize) {
      const batch = recipients.slice(i, i + this.batchSize);
      this.logger.log(`Sending batch ${i / this.batchSize + 1}`);

      for (const recipient of batch) {
        if (recipient.status === 'sent') continue;
        await this.sendWithRetry(campaign.subject, campaign.html, recipient);
      }

      //  processing a batch
      await this.prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { recipients: recipients.length > 0 ? (recipients as unknown as Prisma.InputJsonValue) : [] },
      });



      await sleep(2000);
    }
  }

  private async sendWithRetry(subject: string, html: string, recipient: Recipient) {
    for (let attempt = recipient.attemptCount + 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.mailService.sendMail({
          to: recipient.email,
          subject,
          html,
        });

        recipient.status = 'sent';
        recipient.sentAt = new Date().toISOString();
        recipient.attemptCount = attempt;
        this.logger.log(` Sent to ${recipient.email}`);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        recipient.attemptCount = attempt;
        recipient.error = msg;

        if (attempt < this.maxRetries) {
          await sleep(backoffDelay(attempt));
        } else {
          recipient.status = 'failed';
          this.logger.error(` Giving up on ${recipient.email}`);
        }
      }
    }
  }

  async createNewsletterCampaign(dto: CreateNewsletterAutomationDto) {

    function bdNowAsUTC(): Date {
      const now = new Date(); //(UTC / local)

      // BD = UTC+6
      const bdOffset = 6 * 60; // minutes
      const utcTime = new Date(now.getTime() - bdOffset * 60 * 1000);

      return utcTime;
    }
    const scheduledAt: Date = dto.scheduledAt ? new Date(dto.scheduledAt) : bdNowAsUTC();
    return this.prisma.newsletterCampaign.create({
      data: {
        title: dto.title,
        subject: dto.subject,
        html: dto.html,
        status: dto.status ?? 'SCHEDULED',
        scheduledAt:scheduledAt,
        recipients: [],
      },
    });
  }

  async allNewsletterCampaign() {
    return this.prisma.newsletterCampaign.findMany();
  }
}

