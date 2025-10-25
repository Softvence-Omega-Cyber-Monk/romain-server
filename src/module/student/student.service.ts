// src/student/student.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentIdService } from './student-id.service';
import { SystemRole, StudentStatus, Prisma ,User as PrismaUser,Student as PrismaStudent} from '@prisma/client';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentDebtService } from '../student-debt/student-debt.service';
import { UserService } from '../user/user.service';
import { GetStudentsDto } from './dto/get-students.dto';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { MailService } from '../mail/mail.service';
import { BulkEnrollResultDto } from './dto/bulk-enroll-result.dto';

interface CsvRow {
    firstName: string;
    lastName: string;
    email: string;
    currentLevelId: string;
    currentSessionId: string;
}



@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private studentDebtService: StudentDebtService,
    private studentIdService: StudentIdService,
    private mailService: MailService,
  ) {}

  /**
   * GM enrolls a single new student: Generates Student ID, creates Student record, 
   * User account, and initial debt, all within a single database transaction.
   */
 async enrollSingleStudent(institutionId: string, dto: CreateStudentDto) {
    // 1. Validate Level and Session
    const level = await this.prisma.level.findUnique({
      where: { id: dto.currentLevelId },
      include: { programme: { include: { session: true } } },
    });

    if (!level || level.programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Invalid academic Level or not found for this institution.');
    }
    if (level.programme.sessionId !== dto.currentSessionId) {
      throw new BadRequestException('The selected Level is not part of the specified Session.');
    }

    // 2. Fetch institution name for email
    const institution = await this.prisma.institution.findUniqueOrThrow({
      where: { id: institutionId },
      select: { name: true },
    });

    const tempPassword = process.env.STUDENT_TEMP_PASS as string;

    // 3. Database transaction for atomic creation
    const [newStudent, newUser, studentId] = await this.prisma.$transaction(async (tx) => {
      const generatedStudentId = await this.studentIdService.generateUniqueStudentId(
        institutionId,
        dto.currentSessionId,
        dto.currentLevelId,
        tx as Prisma.TransactionClient,
      );

      const student = await tx.student.create({
        data: {
          registrationNumber: generatedStudentId,
          currentLevelId: dto.currentLevelId,
          currentSessionId: dto.currentSessionId,
          institutionId: institutionId,
          status: StudentStatus.ON_HOLD,
          isRegistered: true,
        },
      });

      const user = await this.userService.createStudentUser(
        {
          email: dto.email,
          password: tempPassword,
          institutionId: institutionId,
          studentProfileId: student.id,
          role: SystemRole.STUDENT,
          firstName: dto.firstName,
          lastName: dto.lastName,
          studentId: generatedStudentId,
          institutionName: institution.name,
        },
        tx as Prisma.TransactionClient,
      );

      await this.studentDebtService.generateInitialDebt(
        { studentProfileId: student.id, levelId: dto.currentLevelId },
        tx as Prisma.TransactionClient,
      );

      return [student, user, generatedStudentId];
    });

    // 4. Generate activation link
    const { activationToken, id } = newUser;
    const { activationLink } = this.userService.generateActivationLink(id, activationToken!);

    const emailPayload: StudentActivationPayload = {
      to: newUser.email,
      studentId: studentId,
      tempPassword: tempPassword,
      activationLink: activationLink,
      institutionName: institution.name,
    };

    // 5. Send email synchronously
    try {
      await this.mailService.sendStudentActivationEmailSynchronous(emailPayload);
      console.log(`[Email Success] Activation email sent for student: ${studentId}`);
    } catch (err) {
      console.error(`[Email Fail] Could not send email for student ${studentId}:`, err);
    }

    // 6. Return final response
    return {
      studentId,
      student: newStudent,
      user: { id: newUser.id, email: newUser.email },
    };
  }


async findMyProfile(userId: string) {
    // 1. Find the User first, ensuring they exist and fetching the linked studentProfileId
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
            studentProfileId: true, 
            email: true, 
            firstName: true, 
            lastName: true, 
            phone: true,
            profileImage:true
        } 
    });

    if (!user || !user.studentProfileId) {
        throw new NotFoundException('Student profile not found for the logged-in user.');
    }

    // 2. Use the fetched studentProfileId to retrieve the detailed Student record
    const studentProfile = await this.prisma.student.findUnique({
        where: { id: user.studentProfileId }, // 💡 CORRECTED LOOKUP
        select: {
            id: true,
            registrationNumber: true,
            status: true,
            previousBalance: true,
            
            // Academic Context
            currentLevel: {
             
               select: {  name:true, programme:true } },
            currentSession: { select: { name: true, startDate:true,endDate: true } },
            
            // Institution Details
            institution: { select: { name: true } },
        },
    });

    if (!studentProfile) {
        // Highly unlikely, but a safety check if the foreign key points to a deleted student.
        throw new NotFoundException('Student record linkage is broken.');
    }

    // 3. Combine and return the data (User details + Student Profile details)
    return { 
        ...studentProfile, 
        user: { 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            phoneNumber: user.phone,
            profileImage:user.profileImage
        } 
    };
  }

 async findAllStudents(institutionId: string, query: GetStudentsDto) {
        const { page, limit, search, studentId, currentLevelId, status } = query;
        const skip = (page - 1) * limit;

        // 1. Base WHERE clause (Scoped to Institution + Static Filters)
        const where: Prisma.StudentWhereInput = {
            institutionId: institutionId,
            ...(studentId && { registrationNumber: studentId }),
            ...(currentLevelId && { currentLevelId: currentLevelId }),
            // Check if status is a valid enum value if filtering
            ...(status && Object.values(StudentStatus).includes(status as StudentStatus) && { status: status as StudentStatus }),
        };

        // 2. Add dynamic search criteria (OR logic applied to User fields)
        if (search) {
            // This OR is applied as an AND to the static WHERE clause above.
            where.AND = {
                OR: [
                    // Search on the related User's first name
                    { User: { firstName: { contains: search, mode: 'insensitive' } } },
                    // Search on the related User's last name
                    { User: { lastName: { contains: search, mode: 'insensitive' } } },
                    // Search on the related User's email
                    { User: { email: { contains: search, mode: 'insensitive' } } },
                ],
            };
        }
        
        // 3. Perform two queries (data and count) in parallel
        const [students, total] = await this.prisma.$transaction([
            this.prisma.student.findMany({
                where: where,
                skip: skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc', // Show newest students first
                },
                select: {
                    id: true,
                    registrationNumber: true,
                    status: true,
                    isRegistered: true,
                    previousBalance: true,
                    User: { 
                        select: { email: true, firstName: true, lastName: true, phone: true,     profileImage:true } 
                    },
                    currentLevel: { 
                        select: {
                        name:true,
                        programme:{select:{name:true}}
                     } 
                    },
                    currentSession: { select: { name: true } },
                },
            }),
            this.prisma.student.count({ where: where }),
        ]);

        return {
            data: students,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            },
        };
    }




    /**
     * GM bulk enrolls students from a CSV file.
     */
    async bulkEnrollStudents(institutionId: string, fileBuffer: Buffer): Promise<BulkEnrollResultDto> {
        const tempPassword = process.env.STUDENT_TEMP_PASS as string;
        const institution = await this.prisma.institution.findUniqueOrThrow({
            where: { id: institutionId },
            select: { name: true }
        });

        // 1. Parse CSV and basic row validation (synchronous)
        const csvRows: CsvRow[] = await this.parseCsv(fileBuffer);
        const recordsToProcess: { data: CsvRow; row: number }[] = [];
        const failures: { row: number; reason: string }[] = [];

        csvRows.forEach((row, index) => {
            if (!row.email || !row.currentLevelId || !row.currentSessionId || !row.firstName || !row.lastName) {
                failures.push({ row: index + 2, reason: 'Missing mandatory fields (firstName, lastName, email, currentLevelId, or currentSessionId).' });
            } else {
                recordsToProcess.push({ data: row, row: index + 2 });
            }
        });

        if (recordsToProcess.length === 0) {
            return {
                totalRecords: csvRows.length,
                successfulEnrollments: 0,
                failedEnrollments: csvRows.length,
                failures: failures,
            };
        }

        // 2. Advanced Pre-Validation (Batch DB checks)
        const emails = recordsToProcess.map(r => r.data.email);
        const existingUsers = await this.prisma.user.findMany({ where: { email: { in: emails } } });
        const existingEmailMap = new Map(existingUsers.map(u => [u.email, u.email]));

        const levelIds = [...new Set(recordsToProcess.map(r => r.data.currentLevelId))];
        const validLevels = await this.prisma.level.findMany({
            where: { 
                id: { in: levelIds },
                programme: { session: { institutionId: institutionId } }
            },
            select: { id: true, programme: { select: { sessionId: true } } }
        });
        const validLevelMap = new Map(validLevels.map(l => [l.id, l]));

        const finalBatch: { row: number; data: CsvRow }[] = [];

        recordsToProcess.forEach(item => {
            // Check 1: Duplicate Email
            if (existingEmailMap.has(item.data.email)) {
                failures.push({ row: item.row, reason: `Email ${item.data.email} already exists in the system.` });
                return;
            }
            // Check 2: Valid Level and Session combination
            const level = validLevelMap.get(item.data.currentLevelId);
            if (!level || level.programme.sessionId !== item.data.currentSessionId) {
                failures.push({ row: item.row, reason: 'Invalid Level ID or Level/Session combination for this institution.' });
                return;
            }
            finalBatch.push(item);
        });

        const successfulRecords: { student: PrismaStudent; user: PrismaUser; activationLink: string }[] = [];

        // 3. DATABASE TRANSACTION: Atomic creation of all valid records
        try {
            // Use a transaction to ensure either all successful students are created, or none are.
            await this.prisma.$transaction(async (tx) => {
                for (const item of finalBatch) {
                    const dto = item.data;

                    // A. Generate Student ID (must be done individually and sequentially to ensure uniqueness)
                    const studentId = await this.studentIdService.generateUniqueStudentId(
                        institutionId, 
                        dto.currentSessionId, 
                        dto.currentLevelId,
                        tx
                    );

                    // B. Create the Student Profile
                    const newStudentRecord = await tx.student.create({
                        data: {
                            registrationNumber: studentId, 
                            currentLevelId: dto.currentLevelId,
                            currentSessionId: dto.currentSessionId,
                            institutionId: institutionId,
                            status: StudentStatus.ON_HOLD,
                        },
                    });

                    // C. Create the User Account (calls an internal service method that uses the transaction client)
                    const newUserRecord = await this.userService.createStudentUser({
                        email: dto.email,
                        password: tempPassword, 
                        institutionId: institutionId,
                        studentProfileId: newStudentRecord.id,
                        role: SystemRole.STUDENT,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        studentId: studentId,
                        institutionName: institution.name,
                    }, tx as Prisma.TransactionClient);

                    // D. Financial Initialization (Auto-Invoicing)
                    await this.studentDebtService.generateInitialDebt(
                        {
                            studentProfileId: newStudentRecord.id,
                            levelId: dto.currentLevelId,
                        },
                        tx as Prisma.TransactionClient
                    );
                    
                    // The createStudentUser method returns the User and also generates the token and link
                    // We need to retrieve the activation link details from the User record
                    const { activationToken, id } = newUserRecord;
                    const { activationLink } = this.userService.generateActivationLink(id, activationToken!);

                    successfulRecords.push({ 
                        student: newStudentRecord, 
                        user: newUserRecord, 
                        activationLink 
                    });
                }
            });
            // Transaction successfully committed here.

        } catch (error) {
            // A transaction failure means we need to mark all attempted records as failed.
            // Since `finalBatch` was attempted, we push its contents to failures.
            finalBatch.forEach(item => {
                failures.push({ row: item.row, reason: `Database Transaction Failed (Atomic Rollback): ${error.message}` });
            });
            // Clear successfulRecords as the transaction rolled back.
            successfulRecords.length = 0; 
            
            // Re-throw if it's a critical, unhandled error, otherwise proceed to return the summary.
            if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
                 throw new InternalServerErrorException(`Bulk enrollment failed due to a critical error: ${error.message}`);
            }
        }

        // 4. Queue Emails (OUTSIDE of the main transaction)
        for (const record of successfulRecords) {
            await this.mailService.queueStudentActivationEmail({
                to: record.user.email,
                studentId: record.student.registrationNumber!,
                tempPassword: tempPassword, 
                activationLink: record.activationLink,
                institutionName: institution.name,
            });
        }
        
        // 5. Return Summary
        return {
            totalRecords: csvRows.length,
            successfulEnrollments: successfulRecords.length,
            failedEnrollments: failures.length,
            failures: failures,
        };
    }

    /** Helper to parse the CSV buffer into an array of objects */
    private parseCsv(fileBuffer: Buffer): Promise<CsvRow[]> {
        return new Promise((resolve, reject) => {
            const results: CsvRow[] = [];
            const readable = Readable.from(fileBuffer.toString());

            readable
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results as CsvRow[]))
                .on('error', (error) => reject(new BadRequestException(`CSV Parsing Error: ${error.message}`)));
        });
    }



}