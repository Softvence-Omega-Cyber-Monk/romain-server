// src/user/user.service.ts
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SystemRole, User, Prisma, StudentStatus } from '@prisma/client';
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
    private emailService: MailService,
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
    
    // const { activationLink } = this.generateActivationLink(newUser.id, token);

    // await this.emailService.sendStudentActivationEmail({
    //     to: newUser.email,
    //     studentId: payload.studentId,
    //     tempPassword: payload.password, // The clear-text version for the student
    //     activationLink: activationLink,
    //     institutionName: payload.institutionName,
    // });

return newUser;
 }

 // --- Helper for Activation Link (Used after successful account creation) ---
 public generateActivationLink(userId: string, token: string): ActivationTokenResult {
  const activationLink = `${process.env.CLIENT_URL}/activate?id=${userId}&token=${token}`; 
 return { token, activationLink };
 }

async activateAccount(userId: string, token: string, newPassword: string) {

    // 1. Find User by ID and Token (and include the necessary Student link)
    const user = await this.prisma.user.findUnique({
        where: { 
            id: userId, 
            activationToken: token, // Validate token match
        },
        select: {
            id: true,
            studentProfileId: true, // Needed to update the Student record
            isActive: true,
            tokenExpiry: true,
            role: true,
        }
    });

    // 2. Validation
    if (!user) {
        throw new BadRequestException('Invalid activation link or User ID.');
    }
    if (user.tokenExpiry! < new Date()) {
        // Since we checked the token in the query, this handles expiry separately
        throw new BadRequestException('Activation link has expired.'); 
    }
    if (user.isActive) {
        throw new BadRequestException('Account is already active.');
    }
    if (user.role !== SystemRole.STUDENT || !user.studentProfileId) {
        throw new InternalServerErrorException('Account type mismatch or profile link missing.');
    }

    // 3. Hash the new, permanent password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Perform Transactional Update (User and Student)
    const [updatedUser, updatedStudent] = await this.prisma.$transaction([
        // A. Update the User record: Set password, set isActive=true, clear tokens
        this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                isActive: true, // Login access is granted
                activationToken: null,
                tokenExpiry: null,
            },
        }),

        // B. Update the Student record: Change status from ON_HOLD to ACTIVE
        this.prisma.student.update({
            where: { id: user.studentProfileId }, // Look up by the ID linked to the User
            data: {
                status: StudentStatus.ACTIVE, // Academic/Enrollment status is confirmed
            },
        }),
    ]);

    // Return the newly activated user and the student's registration number
    return { updatedUser, registrationNumber: updatedStudent.registrationNumber };
}

/**
     * GM only: Manually sets the isActive status of a student account 
     * identified by their Student ID, scoped by the institutionId.
     */
    async manuallySetAccountStatus(institutionId: string, studentId: string, isActive: boolean): Promise<User> {
        
        // 1. Find the User associated with the Student ID
        const studentProfile = await this.prisma.student.findUnique({
            where: { 
                registrationNumber: studentId, 
                institutionId: institutionId, 
            },
            select: { 
                User: true 
            }
        });

        if (!studentProfile || !studentProfile.User) {
            throw new NotFoundException(`Student account with ID ${studentId} not found in your institution.`);
        }

        const userId = studentProfile.User.id;

        // 2. Perform the update
        return this.prisma.user.update({
            where: { id: userId },
            data: { 
                isActive: isActive,
                activationToken: isActive ? null : studentProfile.User.activationToken,
                tokenExpiry: isActive ? null : studentProfile.User.tokenExpiry,
            },
        });
    }


}