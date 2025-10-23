// src/user/user.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SystemRole, User } from '@prisma/client';

// Define the shape of data required to create a student user (Internal DTO)
interface CreateStudentUserPayload {
  email: string;
  password: string;
  institutionId: string;
  studentProfileId: string;
  role: SystemRole;
  firstName:string;
  lastName:string;
}

// Define the shape for password/token updates (Internal)
interface ActivationTokenResult {
    token: string;
    activationLink: string;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1. Creates a new User record for a student.
   * 2. Hashes the temporary password (as the student will set a new one).
   * 3. Sets the account status to INACTIVE and generates an activation token.
   * * NOTE: This method is designed to be called within the $transaction of StudentService, 
   * so it uses the standard 'this.prisma' client, and relies on the parent service's transaction 
   * to handle atomicity/rollback.
   */
  async createStudentUser(payload: CreateStudentUserPayload): Promise<User> {
    // Check if user already exists by email (though the student ID is the primary login)
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

    return this.prisma.user.create({
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
            // firstName and lastName should ideally be added from the Student DTO here
        },
    });
  }

  // --- Helper for Activation Link (Used after successful account creation) ---
  public generateActivationLink(userId: string, token: string): ActivationTokenResult {
    const activationLink = `${process.env.CLIENT_URL}/activate?id=${userId}&token=${token}`; 
    return { token, activationLink };
  }


  // --- Main Activation Method (Called by AuthController) ---
// src/user/user.service.ts (Modified activateAccount)

async activateAccount(userId: string, token: string, oldPassword: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // 1. Validate Token and Expiry
    if (!user || user.activationToken !== token || user.tokenExpiry! < new Date()) {
        throw new BadRequestException('Invalid or expired activation link.');
    }
    if (user.isActive) {
        throw new BadRequestException('Account is already active.');
    }
    
    // 2. Validate Temporary Password (The new security hurdle)
    const isTempPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isTempPasswordValid) {
        throw new BadRequestException('Invalid temporary password provided.');
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