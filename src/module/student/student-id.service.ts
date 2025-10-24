// src/student/student-id.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentIdService {
  constructor(private prisma: PrismaService) {}

  async generateUniqueStudentId(institutionId: string, currentSessionId: string, currentLevelId: string): Promise<string> {
    
    // 1. Fetch all necessary data points
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
    
    if (!levelData?.programme) {
        throw new InternalServerErrorException('Student ID generation failed: Programme or Level data is missing.');
    }

    const { programme } = levelData;

    // --- A. Extract Components ---
    const prefix = programme.session.institution.prefix || 'INST';
    
    // Derivation: Get the last two digits of the session start year
    const academicYear = programme.session.startDate.getFullYear().toString().slice(2);

    
    // Null handling: If programme.code is null or undefined, use 'GEN' as the default code.
    const programmeCode = programme.code || 'GEN'; 

    // 2. Get the Sequence Number (unchanged)
    const studentCount = await this.prisma.student.count({
        where: { institutionId, currentSessionId },
    });
    
    const nextSequence = (studentCount + 1).toString().padStart(4, '0'); 
    
    // 3. Assemble the final Student ID: [Prefix]-[Year]-[Code]-[Sequence]
    const studentId = `${prefix}-${academicYear}-${programmeCode}-${nextSequence}`;

    return studentId;
  }
}