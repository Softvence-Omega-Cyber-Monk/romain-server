import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CreateContactDto } from '../contact/dto/create-contact.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface StudentActivationPayload {
    to: string;
    studentId: string;
    tempPassword: string;
    activationLink: string;
    institutionName: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    // FIX 1: When using 'service: gmail', you should NOT manually specify host, port, and secure: false, 
    // as this creates a configuration conflict. Nodemailer handles GMail's secure SMTP (port 465, secure: true) automatically.
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Relying solely on the GMail service settings
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // IMPORTANT: Must be a GMail App Password
      },
    });
  }


  async sendSubscriptionConfirmation(email: string,): Promise<void> {
    const mailOptions = {
      from: '"SoftVence Newsletter" <noreply@softcover.com>',
      to: email,
      subject: '👋 Thanks for Subscribing!',
      html: `
        <h1>Welcome!</h1>
        <p>You have successfully subscribed to our newsletter with the email: <b>${email}</b>.</p>
        <p>Stay tuned for our updates!</p>
      `,
    };
    try {
        await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Nodemailer Error:', error);
      throw new InternalServerErrorException('Failed to send confirmation email.');
    }
  }
  //  NEW METHOD FOR CONTACT FORM
  async sendContactForm(contactData: CreateContactDto): Promise<void> {
    const { name,email, subject, message } = contactData;

    const mailOptions = {
      from: '"Website Contact Form" <noreply@Newsletters-Subscribe.com>',
      to: `tareqsoftvence@gmail.com`, // Send the email TO owner ADMIN
      subject: `[Contact Form] ${subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p>You have received a new message from your website contact form.</p>
        <hr>
        <p><strong>Sender Name:</strong> ${name}</p>
        <p><strong>Sender Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap; border: 1px solid #ccc; padding: 15px;">${message}</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Contact email sent from ${email} to tareqsoftvence@gmail.com`);
    } catch (error) {
      console.error('Nodemailer Error:', error);
      throw new InternalServerErrorException('Failed to process contact form submission.');
    }
  }



  // ----------------------------------------------------------------------------------
// CORE SENDER: The actual logic that runs in a Bull worker (processor)
// ----------------------------------------------------------------------------------
  // NOTE: Renaming this to be private/protected would be ideal, as it should ONLY 
  // be called by the MailProcessor for reliability and retries.
  async sendStudentActivationEmail(payload: StudentActivationPayload): Promise<void> {
        const { to, studentId, tempPassword, activationLink, institutionName } = payload;
        
        const mailOptions = {
            from: `"Student Enrollment: ${institutionName}" <${process.env.SMTP_USER}>`, 
            to: to,
            subject: `✅ ${institutionName}: Account Enrolment and Activation Required`, 
            html: `
                <h1>Welcome to ${institutionName}!</h1> 
                <p>Your account has been successfully created by the General Manager. Please complete your registration immediately by activating your account.</p>
                
                <hr style="border: 1px solid #ccc;">

                <h2>Your Credentials:</h2>
                <p><strong>Institution:</strong> <code>${institutionName}</code></p>
                <p><strong>Student ID:</strong> <code>${studentId}</code></p>
                <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
                
                <hr style="border: 1px solid #ccc;">

                <h3>Action Required: Account Activation</h3>
                <p>Click the link below to activate your account and set your permanent password. This link is valid for **24 hours**.</p>
                <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                    Activate My Account
                </a>
                
                <p style="margin-top: 20px; font-size: 0.9em; color: #555;">
                    <strong>Note:</strong> If the link expires, please contact the institution authority to manually activate your account. You will then be able to log in with your Student ID and the Temporary Password provided above.
                </p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Nodemailer Error: Failed to send student activation email:', error);
            // FIX 2: Re-throw the error so the calling service (Bull Processor or API handler) knows the send failed.
            // This allows the Bull worker to trigger a retry (attempts: 3) for bulk jobs.
            // If called synchronously, this will fail the API call, which is better than silent failure.
            throw new InternalServerErrorException('Failed to send student activation email.');
        }
    }


  // ----------------------------------------------------------------------------------
// ASYNC QUEUING: Used by bulk process, must be used by single process too!
// ----------------------------------------------------------------------------------
  async queueStudentActivationEmail(payload: StudentActivationPayload): Promise<void> {
    // Add the job to the queue. No await needed here, this is fast.
    // Set a delay or rate limit options if necessary.
    await this.emailQueue.add('student-activation', payload, {
        attempts: 3, // Retry failed sends 3 times
    });
  }



  // ----------------------------------------------------------------------------------
// SYNCHRONOUS SENDER: For single enrollment (as requested)
// ----------------------------------------------------------------------------------
  /**
   * Immediately sends the student activation email without using the queue.
   * This is used for synchronous operations like single enrollment where direct feedback is sometimes preferred.
   */
  async sendStudentActivationEmailSynchronous(payload: StudentActivationPayload): Promise<void> {
        await this.sendStudentActivationEmail(payload);
    }





/**
   * Sends an email to the General Manager confirming Institution approval and account activation.
   */
  async sendGMApprovalEmail(to: string, institutionName: string, gmName: string): Promise<void> {
        const mailOptions = {
            from: `"Ochora -System Administration" <${process.env.SMTP_USER}>`, 
            to: to,
            subject: `🎉 Account Activated: ${institutionName} is Live!`, 
            html: `
                <h1>Congratulations, ${gmName}!</h1> 
                <p>We are pleased to inform you that your request for **${institutionName}** has been reviewed and **approved** by the Super Administrator.</p>
                
                <hr style="border: 1px solid #ccc;">

                <h2>Your Account is Now Active!</h2>
                <p>Your General Manager account for **${institutionName}** has been activated. You can now log in to the system using your registered email address:</p>
                
                <p style="font-size: 1.1em;"><strong>Email:</strong> <code>${to}</code></p>
                
                <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                    Go to Login Page
                </a>
                
                <p style="margin-top: 20px; font-size: 0.9em; color: #555;">
                    *Please use the password you set during the initial sign-up process.*
                </p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Nodemailer Error: Failed to send GM approval email:', error);
            // NOTE: We don't throw an error here to prevent blocking the successful database transaction.
        }
    }
}
