// src/student/student.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentIdService } from './student-id.service';
import { SystemRole, StudentStatus, Prisma } from '@prisma/client';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentDebtService } from '../student-debt/student-debt.service';
import { UserService } from '../user/user.service';
import { GetStudentsDto } from './dto/get-students.dto';

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private studentDebtService: StudentDebtService,
    private studentIdService: StudentIdService,
  ) {}

  /**
   * GM enrolls a single new student: Generates Student ID, creates Student record, 
   * User account, and initial debt, all within a single database transaction.
   */
  async enrollStudent(institutionId: string, dto: CreateStudentDto) {
    // 1. Pre-validation (Outside Transaction)
    const level = await this.prisma.level.findUnique({
        where: { id: dto.currentLevelId },
        include: { programme: { include: { session: true } } },
    });
    
    // Ensure Level is valid and belongs to the correct Institution/Session
    if (!level || level.programme.session.institutionId !== institutionId) {
        throw new NotFoundException('Invalid academic Level or not found for this institution.');
    }
    if (level.programme.sessionId !== dto.currentSessionId) {
        throw new BadRequestException('The selected Level is not part of the specified Session.');
    }

    // Fetch Institution details needed for email (Do this outside the $transaction for safety)
    const institution = await this.prisma.institution.findUniqueOrThrow({
    where: { id: institutionId },
    select: { name: true } // Only fetch the name
    });
    
    // 2. GENERATE STUDENT ID (Required for login/username)
    // This must also be outside the transaction since it relies on COUNT/SELECT
    const studentId = await this.studentIdService.generateUniqueStudentId(
        institutionId, 
        dto.currentSessionId, 
        dto.currentLevelId
    );

    // 3. DATABASE TRANSACTION: All creation steps must succeed together
    const [newStudent, newUser] = await this.prisma.$transaction(async (tx) => {
        
        // A. Create the Student Profile
        const newStudentRecord = await tx.student.create({
            data: {
                registrationNumber: studentId, 
                currentLevelId: dto.currentLevelId,
                currentSessionId: dto.currentSessionId,
                institutionId: institutionId,
                previousBalance: 0, 
                status: StudentStatus.ON_HOLD,
                isRegistered: true,
            },
        });

        // B. Create the User Account (Authentication/Login)
        // NOTE: This MUST use the transaction client (tx.user) if the userService does DB writes.
        // Assuming createStudentUser is refactored to accept a transaction client (Prisma.TransactionClient) or performs no heavy DB writes itself, we'll keep it simple here:
        const tempPassword=process.env.STUDENT_TEMP_PASS as string;

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

        // C. AUTOMATED FINANCIAL INITIALIZATION (Auto-Invoicing)
        // This debt generation logic must also use the transaction client (tx) for atomicity
        await this.studentDebtService.generateInitialDebt(
            {
                studentProfileId: newStudentRecord.id,
                levelId: dto.currentLevelId,
            },
            tx as Prisma.TransactionClient // Pass the transaction client
        );
        
        return [newStudentRecord, newUserRecord];

    }); // The transaction commits here if successful, or rolls back if an error occurred inside.

    // 4. Return the newly created student data, including the generated Student ID
    return {
        ...newStudent,
        user: { id: newUser.id, email: newUser.email },
        studentId: studentId 
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
}