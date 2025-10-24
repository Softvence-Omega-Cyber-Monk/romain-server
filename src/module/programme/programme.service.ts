import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';


@Injectable()
export class ProgrammeService {
  constructor(private prisma: PrismaService) {}

  /**
   * General Manager creates a new Programme (e.g., degree or course)
   * and links it to an academic session.
   */
  async create(institutionId: string, dto: CreateProgrammeDto) {
    // 1. Validate Session existence and ownership (Multi-tenancy check)
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session || session.institutionId !== institutionId) {
      throw new NotFoundException('Session not found or does not belong to your institution.');
    }

    // 2. Optional: Check for duplicate name within the same session
    const existingProgramme = await this.prisma.programme.findFirst({
        where: { name: dto.name, sessionId: dto.sessionId }
    });
    if (existingProgramme) {
        throw new BadRequestException(`A Programme named "${dto.name}" already exists for this session.`);
    }

    // 3. 🚨 NEW VALIDATION: Check for duplicate CODE within the same session
    if (dto.code) {
        const existingProgrammeByCode = await this.prisma.programme.findFirst({
            where: { 
                // Case-insensitive check is often better for codes
                code: dto.code, 
                sessionId: dto.sessionId 
            }
        });
        
        if (existingProgrammeByCode) {
            throw new BadRequestException(`A Programme with code "${dto.code}" already exists for this session.`);
        }
    }

    // 3. Create the Programme
    return this.prisma.programme.create({
      data: {
        name: dto.name,
        sessionId: dto.sessionId,
        code:dto.code
      },
    });
  }

  // Add a read method for the GM to list all programmes in their institution
  async getInstitutionProgrammes(institutionId: string) {
      return this.prisma.programme.findMany({
          where: { session: { institutionId: institutionId } },
          include: { session: { select: { name: true, isActive: true } } },
          orderBy: { createdAt: 'desc' }
      });
  }


/**
   * General Manager updates a Programme's details (e.g., name).
   */
 // 1. Validate Programme existence and ownership
async updateProgramme(institutionId: string, programmeId: string, dto: UpdateProgrammeDto) {
 const programme = await this.prisma.programme.findUnique({
 where: { id: programmeId },
include: { session: true }, 
 });

if (!programme || programme.session.institutionId !== institutionId) {
 throw new NotFoundException('Programme not found or does not belong to your institution.');
 }

 // If the name is being updated, perform the uniqueness check
if (dto.name) {
 // 2. CRITICAL VALIDATION: Check for duplicate name within the same Session, 
      // but exclude the current Programme ID from the check.
 const existingProgramme = await this.prisma.programme.findFirst({
 where: { 
 name: dto.name, 
 sessionId: programme.sessionId, // Must be unique within the current session
 NOT: { id: programmeId },       // Exclude the record being updated
 },
});
if (existingProgramme) {
throw new BadRequestException(`A Programme named "${dto.name}" already exists in this session.`);
}
}

if (dto.code) {
        const existingProgrammeByCode = await this.prisma.programme.findFirst({
            where: { 
                code: dto.code, 
                sessionId: programme.sessionId,
                NOT: { id: programmeId }, 
            },
        });
        if (existingProgrammeByCode) {
            throw new BadRequestException(`A Programme with code "${dto.code}" already exists in this session.`);
        }
    }

 // 2. Perform the update
return this.prisma.programme.update({
 where: { id: programmeId },
 data: { name: dto.name,code:dto.code },
});
}

 /**
   * General Manager deletes a Programme.
   * Business Logic: A programme can only be deleted if it has NO associated levels.
   * (If levels exist, deletion must be blocked to prevent orphans or loss of historical fee data).
   */
async deleteProgramme(institutionId: string, programmeId: string) {
 // 1. Validate Programme existence and ownership
const programme = await this.prisma.programme.findUnique({
where: { id: programmeId },
include: { 
          session: true, 
          levels: { select: { id: true } } // Check for existing levels
        }, 
});

if (!programme || programme.session.institutionId !== institutionId) {
throw new NotFoundException('Programme not found or does not belong to your institution.');
}

// 2. CRITICAL: Check if any Levels are linked. 
// If the Programme has Levels, it means a fee structure exists, and deletion should be blocked.
 if (programme.levels.length > 0) {
throw new BadRequestException('Cannot delete Programme. It has existing Levels (fee structures) linked to it.');
 }

// 3. Perform the delete
 await this.prisma.programme.delete({
 where: { id: programmeId },
});

 return { message: `Programme ${programme.name} deleted successfully.` };
}




}