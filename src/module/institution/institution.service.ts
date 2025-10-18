import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SystemRole } from '@prisma/client';
import { OnboardInstitutionDto } from './dto/onboarding.dto';

@Injectable()
export class InstitutionService {
  private readonly saltRounds = 10; // Define salt rounds for bcrypt

  constructor(private prisma: PrismaService) {}

  /**
   * Handles the public request to onboard a new institution.
   * Creates the Institution (inactive) and the first General Manager user in a transaction.
   */
  async requestOnboarding(dto: OnboardInstitutionDto) {
    // 1. Check if the manager's email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.managerEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Manager email already registered.');
    }

    // 2. Hash the initial password for security
    const hashedPassword = await bcrypt.hash(dto.managerPassword, this.saltRounds);

    // Use a transaction to ensure atomic creation of Institution and User
    return this.prisma.$transaction(async (tx) => {
      // 3. Create the Institution (isActive: false by default)
      const institution = await tx.institution.create({
        data: {
          name: dto.name,
          address: dto.address,
          prefix: dto.prefix,
          bankName: dto.bankName,
          cardHolder: dto.cardHolder,
          RIB_IBAN: dto.RIB_IBAN,
          BIC_SWIFT: dto.BIC_SWIFT,
          KYC_documents: dto.KYC_documents||'',
        },
      });

      // 4. Create the General Manager User
      const managerUser = await tx.user.create({
        data: {
          firstName: dto.managerFirstName,
          lastName: dto.managerLastName,
          email: dto.managerEmail,
          phone: dto.managerPhone,
          password: hashedPassword,
          role: SystemRole.GENERAL_MANAGER, // Assign the top school role
          institutionId: institution.id, // CRITICAL: Link to the new institution
        },
        select: { id: true, email: true, role: true }, // Select minimal data for response
      });

      // NOTE: Here you would ideally queue an email to the Super Admin for validation notification

      return {
        institutionId: institution.id,
        institutionName: institution.name,
        manager: managerUser,
      };
    });
  }

  /**
   * Retrieves all institutions awaiting Super Admin validation (isActive: false).
   */
  async getPendingInstitutions() {
    return this.prisma.institution.findMany({
      where: { isActive: false },
      include: { User: { where: { role: SystemRole.GENERAL_MANAGER } } }, // Show the associated manager
    });
  }

  /**
   * Super Admin action to approve or reject a school's onboarding request.
   */
  async validateInstitution(id: string, approve: boolean) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution with ID ${id} not found.`);
    }

    if (institution.isActive && approve) {
      throw new BadRequestException('Institution is already active.');
    }
    
    // Use a transaction to handle both approval/rejection and potential user update
    return this.prisma.$transaction(async (tx) => {
      if (approve) {
        // Approval: Set isActive to true
        const updatedInstitution = await tx.institution.update({
          where: { id },
          data: { isActive: true },
        });

        // NOTE: Here you would typically send an email notification to the General Manager
        // telling them their account is approved and ready for login.
        
        return { message: 'Institution approved and activated successfully.', institution: updatedInstitution };
      } else {
        // Rejection: Delete the Institution and the associated General Manager user.
        // Prisma will handle dependent relationships if configured (e.g., Cascade Delete)

        // 1. Find the associated General Manager user
        const managerUser = await tx.user.findFirst({
            where: { institutionId: id, role: SystemRole.GENERAL_MANAGER },
        });
        
        if (managerUser) {
            await tx.user.delete({ where: { id: managerUser.id } });
        }
        
        // 2. Delete the institution
        await tx.institution.delete({ where: { id } });

        return { message: 'Institution and associated user rejected and deleted successfully.' };
      }
    });
  }

  async getAllInstitutions(page: number, limit: number) {
    // 1. Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // 2. Fetch the paginated institutions
    const institutions = await this.prisma.institution.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc', // Order by creation date, newest first
      },
      select: { // Select only necessary fields for a list view
        id: true,
        name: true,
        prefix: true,
        isActive: true,
        createdAt: true,
        // You might include a count of staff users here if needed:
        // _count: { select: { User: true } }
      }
    });

    // 3. Get the total count for pagination metadata
    const totalCount = await this.prisma.institution.count();
    const totalPages = Math.ceil(totalCount / limit);

    return {
      institutions,
      meta: {
        totalItems: totalCount,
        itemCount: institutions.length,
        itemsPerPage: limit,
        totalPages: totalPages,
        currentPage: page,
      },
    };
  }
}