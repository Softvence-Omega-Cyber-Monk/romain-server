// src/user/user.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SystemRole, User, Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';


// Define the shape of data required to create a student user (Internal DTO)
interface CreateStudentUserPayload {
 email: string;
 password: string; // The clear-text temporary password
 institutionId: string;
 studentProfileId: string;
 role: SystemRole;
 firstName:string;
 lastName:string;
 studentId: string; 
 institutionName: string;
}

// Define the shape for password/token updates (Internal)
interface ActivationTokenResult {
 token: string;
 activationLink: string;
}

@Injectable()
export class UserService {
 constructor(
    private prisma: PrismaService,
    private emailService: MailService, // <-- INJECTED
  ) {}

 /**
   * 1. Creates a new User record, hashes the temp password, and generates token.
   * 2. Sends the activation email with the temporary credentials.
   * NOTE: The User record creation MUST use the transaction client (tx) for atomicity.
   */
 async createStudentUser(payload: CreateStudentUserPayload, tx: Prisma.TransactionClient): Promise<User> {
  // Check if user already exists by email (done with main Prisma client, OK outside transaction)
const existingUser = await this.prisma.user.findUnique({
where: { email: payload.email },
  });
  if (existingUser) {
throw new BadRequestException('A user account with this email already exists.');
  }

  // Hash the temporary password
 const hashedPassword = await bcrypt.hash(payload.password, 10);
  
  // Generate token and expiry for activation
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours validity

    // --- 1. Create User Record (using Transaction Client: tx) ---
  const newUser = await tx.user.create({
  data: {
  email: payload.email,
    password: hashedPassword, // Store temporary hash
    institutionId: payload.institutionId,
    studentProfileId: payload.studentProfileId,
    role: payload.role,
    isActive: false, // Account starts inactive
    activationToken: token,
    tokenExpiry: tokenExpiry,
    firstName:payload.firstName,
    lastName:payload.lastName
    },
  });

    // --- 2. Send Email (OUTSIDE TRANSACTION/COMMIT) ---
    // Email sending should happen AFTER the DB transaction commits, but since the
    // DB operations in this service are part of the parent StudentService transaction, 
    // we assume the risk of the email being sent before a DB failure *or* rely on 
    // the EmailService to be robust. For simplicity, we trigger it here:
    
    const { activationLink } = this.generateActivationLink(newUser.id, token);

    await this.emailService.sendStudentActivationEmail({
        to: newUser.email,
        studentId: payload.studentId,
        tempPassword: payload.password, // The clear-text version for the student
        activationLink: activationLink,
        institutionName: payload.institutionName,
    });

return newUser;
 }

 // --- Helper for Activation Link (Used after successful account creation) ---
 public generateActivationLink(userId: string, token: string): ActivationTokenResult {
  const activationLink = `${process.env.CLIENT_URL}/activate?id=${userId}&token=${token}`; 
 return { token, activationLink };
 }


 // --- Main Activation Method (Called by AuthController) ---
  async activateAccount(userId: string, token: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // ... (rest of activation logic remains unchanged) ...
    
    // 1. Validate Token and Expiry
    if (!user || user.activationToken !== token || user.tokenExpiry! < new Date()) {
        throw new BadRequestException('Invalid or expired activation link.');
    }
    if (user.isActive) {
        throw new BadRequestException('Account is already active.');
    }

    // 3. Hash and store the new, permanent password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword, // Store the permanent hash
            isActive: true,
            activationToken: null,
            tokenExpiry: null,
        },
    });
  }
}