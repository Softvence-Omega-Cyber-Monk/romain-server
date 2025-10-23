// src/student/student-id.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentIdService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a unique Student ID based on institution's prefix and academic context.
   * e.g., UNIV-25-CS-0042
   */
  async generateUniqueStudentId(institutionId: string, currentSessionId: string, currentLevelId: string): Promise<string> {
    
    // 1. Get Institution Prefix and related data (Level/Programme/Session details)
    const institution = await this.prisma.institution.findUniqueOrThrow({
        where: { id: institutionId },
        select: { prefix: true },
    });
    
    // In a real system, you'd fetch the Programme code (e.g., 'CS' for Computer Science) 
    // and the academic year (e.g., '25' for 2025/2026).
    
    // --- SIMPLIFIED IMPLEMENTATION FOR SEQUENCE GENERATION ---
    
    // A simple counter based on the institution for the current year/session.
    // NOTE: For a robust system, this counter logic is complex and should be transactional.
    
    const currentYear = new Date().getFullYear().toString().slice(2); // e.g., '25'
    const prefix = institution.prefix || 'INST';
    
    // Get the current number of students enrolled in this institution this session
    const studentCount = await this.prisma.student.count({
        where: { institutionId, currentSessionId },
    });
    
    const nextSequence = (studentCount + 1).toString().padStart(4, '0'); // e.g., '0042'
    
    // You must adapt this formula: [Prefix]-[Year]-[Code]-[Sequence]
    // For now, let's use a simple format:
    const studentId = `${prefix}-${currentYear}-${nextSequence}`;

    return studentId;
  }
}