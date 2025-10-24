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



  /**
     * Sends the initial activation email to the newly enrolled student.
     * Contains the Student ID, Temporary Password, and Activation Link.
     */
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
            throw new InternalServerErrorException('Enrollment failed: Could not send activation email.');
        }
    }
}



