// src/mail/mail.processor.ts
import { Process, Processor} from '@nestjs/bull';
import { Job } from 'bull';
import { MailService, StudentActivationPayload } from './mail.service'; // Assuming MailService exports the payload type
import { Logger } from '@nestjs/common';

@Processor('email') // This connects to the 'email' queue
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('student-activation')
  async handleStudentActivationEmail(job: Job<StudentActivationPayload>) {
    this.logger.log(`Processing student-activation job ${job.id} for ${job.data.to}`);
    
    // We call the core sending logic here, which is the actual synchronous I/O.
    // NOTE: This runs in a separate process/thread, not blocking the main API.
    try {
      await this.mailService.sendStudentActivationEmail(job.data);
      this.logger.log(`Successfully sent email for job ${job.id}.`);
    } catch (error) {
      this.logger.error(`Failed to send email for job ${job.id}: ${error.message}`, error.stack);
      // Bull will automatically handle retries based on queue configuration.
      throw error; 
    }
  }

  // NOTE: You can add more processors for other email types (e.g., 'password-reset')
}