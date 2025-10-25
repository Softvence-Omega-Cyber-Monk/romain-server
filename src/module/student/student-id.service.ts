// // src/student/student-id.service.ts

// import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class StudentIdService {
//   constructor(private prisma: PrismaService) {}

//   async generateUniqueStudentId(institutionId: string, currentSessionId: string, currentLevelId: string): Promise<string> {
//     
//     // 1. Fetch all necessary data points
//     const levelData = await this.prisma.level.findUnique({
//         where: { id: currentLevelId },
//         select: { 
//             programme: { 
//                 select: { 
//                     code: true, // This field is now String?
//                     session: {
//                         select: {
//                             startDate: true, 
//                             institution: { select: { prefix: true } }
//                         }
//                     }
//                 } 
//             }
//         },
//     });
    
//     if (!levelData?.programme) {
//         throw new InternalServerErrorException('Student ID generation failed: Programme or Level data is missing.');
//     }

//     const { programme } = levelData;

//     // --- A. Extract Components ---
//     const prefix = programme.session.institution.prefix || 'INST';
    
//     // Derivation: Get the last two digits of the session start year
//     const academicYear = programme.session.startDate.getFullYear().toString().slice(2);

    
//     // Null handling: If programme.code is null or undefined, use 'GEN' as the default code.
//     const programmeCode = programme.code || 'GEN'; 

//     // 2. Get the Sequence Number (unchanged)
//     const studentCount = await this.prisma.student.count({
//         where: { institutionId, currentSessionId },
//     });
//     
//     const nextSequence = (studentCount + 1).toString().padStart(4, '0'); 
//     
//     // 3. Assemble the final Student ID: [Prefix]-[Year]-[Code]-[Sequence]
//     const studentId = `${prefix}-${academicYear}-${programmeCode}-${nextSequence}`;

//     return studentId;
//   }
// }

// src/student/student-id.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// Import Prisma namespace for type hint
import { Prisma, PrismaClient } from '@prisma/client'; 

@Injectable()
export class StudentIdService {
  constructor(private prisma: PrismaService) {}

  // ⚠️ IMPORTANT: Accept the transactional client (tx)
  async generateUniqueStudentId(
    institutionId: string, 
    currentSessionId: string, 
    currentLevelId: string,
    // The calling service (StudentService) passes its transaction client here
    tx: Prisma.TransactionClient | PrismaClient
  ): Promise<string> {
    
    // 1. Fetch necessary static data points (This remains outside the critical section)
  
    const levelData = await this.prisma.level.findUnique({
        where: { id: currentLevelId },
         select: { 
             programme: { 
                 select: { 
                     code: true, // This field is now String?
                    session: {
                        select: {
                           startDate: true, 
                            institution: { select: { prefix: true } }
                        }
                    }
                 } 
             }
        },
     });
    
    // ... (error handling and extraction of prefix, academicYear, programmeCode) ...
    const prefix = levelData?.programme?.session.institution.prefix || 'INST';
    const academicYear = levelData?.programme?.session.startDate.getFullYear().toString().slice(2) || '00';
    const programmeCode = levelData?.programme?.code || 'GEN'; 

    // 2. ATOMIC SEQUENCE GENERATION (Using the passed transaction client)
   const sequenceKey = {
      institutionId_sessionId: {
        institutionId: institutionId,
        sessionId: currentSessionId,
      },
    };

    // Atomically increment the sequence counter inside the transaction (tx)
    const sequenceRecord = await (tx as Prisma.TransactionClient).studentSequence.upsert({
      // 💡 FIX IS HERE: Pass the full 'sequenceKey' object directly to 'where'
      where: sequenceKey, 
      
      // The `create` block uses the flat object structure, which is correct.
      create: {
        institutionId: institutionId, 
        sessionId: currentSessionId, 
        currentSequence: 2, 
      },
      
      update: {
        currentSequence: {
          increment: 1, 
        },
      },
      select: { currentSequence: true },
    });
    // The number we want to use for the new student is the value *before* the increment
    // Since we initialized create with 2 and increment by 1, the new student's sequence 
    // is (currentSequence - 1)
    const nextSequenceNumber = sequenceRecord.currentSequence - 1;

    if (nextSequenceNumber <= 0) {
        throw new InternalServerErrorException('Student ID sequence generation failed.');
    }
    
    const nextSequence = nextSequenceNumber.toString().padStart(4, '0'); 
    
    // 3. Assemble the final Student ID
    const studentId = `${prefix}-${academicYear}-${programmeCode}-${nextSequence}`;

    return studentId;
  }
}