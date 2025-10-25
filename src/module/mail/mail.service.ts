import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CreateContactDto } from '../contact/dto/create-contact.dto';


@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,//'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT),
      secure: false, // Use TLS
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,//'tareqsoftvence@gmail.com',
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,   // tune as needed
      maxMessages: 1000,   // optional timeouts
      greetingTimeout: 30000,
      socketTimeout: 30000,
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
  //  NEW METHOD FOR CONTACT FORM
  async sendContactForm(contactData: CreateContactDto): Promise<void> {
    const { name,email, subject, message } = contactData;

    const mailOptions = {
      from: '"Website Contact Form" <noreply@Newsletters-Subscribe.com>',
      to: process.env.SMTP_USER, // Send the email TO owner ADMIN
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

  async sendMail(options: { to: string; subject: string; html: string; from?: string }) {
    const mailOptions = {
      from: options.from || process.env.MAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
     await this.transporter.sendMail(mailOptions);
    //this.logger.debug(`Sent to ${options.to} messageId=${info.messageId}`);
    //return info;
  }
}
