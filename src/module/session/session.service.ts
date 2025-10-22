import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';


@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * General Manager creates a new academic session.
   * Business Logic: Only one session can be marked isActive=true at a time per institution.
   */
  async create(institutionId: string, dto: CreateSessionDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
        throw new BadRequestException('Session start date must be before the end date.');
    }

    // 1. Check for existing active session in this institution
    const activeSession = await this.prisma.session.findFirst({
      where: {
        institutionId: institutionId,
        isActive: true,
      },
    });

    // 2. If an active session exists, the new one must be created as inactive (or throw error)
    // To simplify the flow, we will create the new session as inactive and require manual activation.
    if (activeSession) {
        // Option 1: Force the new session to be inactive
        return this.prisma.session.create({
            data: {
                 name:dto.name,
                 startDate,
                 endDate,
                institutionId: institutionId,
                isActive: false, // Must be manually activated later
            },
        });
        // Option 2 (Alternative): Throw an error if an active one exists
        // throw new BadRequestException(`An active session (${activeSession.name}) already exists. Please close it first.`);
    }


    // 3. Create the first or only active session
   return this.prisma.session.create({ data: {
 name: dto.name,
 startDate: startDate,
 endDate: endDate,
 institutionId: institutionId,
isActive: true, 
},
});
  }

  /**
   * General Manager gets all sessions for their institution.
   */
  async getInstitutionSessions(institutionId: string) {
    return this.prisma.session.findMany({
      where: { institutionId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * General Manager closes (archives) the current active session.
   */
  async closeSession(institutionId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.institutionId !== institutionId) {
      throw new NotFoundException(`Session with ID ${sessionId} not found or does not belong to your institution.`);
    }

    if (!session.isActive) {
      throw new BadRequestException('This session is already inactive/closed.');
    }
    
    // CRITICAL: Must be wrapped in a transaction to ensure data integrity during archiving
    return this.prisma.$transaction(async (tx) => {
        // 1. Update the Session status to inactive
        const closedSession = await tx.session.update({
            where: { id: sessionId },
            data: { isActive: false },
        });

        // 2. Business Logic: Archiving Student Debts (Placeholder for future step)
        // In the full flow, this is where you would process student promotion, 
        // carry over 'previousBalance', and block non-paying students.

        return closedSession;
    });
  }

  /**
   * General Manager manually activates a session that was previously created as inactive.
   */
  async activateSession(institutionId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.institutionId !== institutionId) {
      throw new NotFoundException(`Session with ID ${sessionId} not found or does not belong to your institution.`);
    }

    if (session.isActive) {
      throw new BadRequestException('This session is already active.');
    }

    // CRITICAL: Ensure no other active session exists before activating
    await this.prisma.session.updateMany({
        where: { institutionId: institutionId, isActive: true },
        data: { isActive: false },
    });

    return this.prisma.session.update({
        where: { id: sessionId },
        data: { isActive: true },
    });
  }
}