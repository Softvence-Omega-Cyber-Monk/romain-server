// src/fee-type/fee-type.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';


@Injectable()
export class FeeTypeService {
  constructor(private prisma: PrismaService) {}

  /**
   * GM creates a new fee category (e.g., 'Tuition Fee').
   */
  async create(institutionId: string, dto:CreateFeeTypeDto) {
    // 1. Check for duplicate name within the institution
    const existingFeeType = await this.prisma.feeType.findFirst({
      where: { name: dto.name, institutionId },
    });
    if (existingFeeType) {
      throw new BadRequestException(`A fee type named "${dto.name}" already exists.`);
    }

    // 2. Create the FeeType
    return this.prisma.feeType.create({
      data: {
        name: dto.name,
        description: dto.description,
        institutionId: institutionId,
      },
    });
  }

  /**
   * GM retrieves all fee categories for the institution.
   */
  async findAll(institutionId: string) {
    return this.prisma.feeType.findMany({
      where: { institutionId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * GM updates a fee category.
   */
  async update(institutionId: string, id: string, dto: UpdateFeeTypeDto) {
    // 1. Validate existence and ownership
    const feeType = await this.prisma.feeType.findUnique({
      where: { id },
    });
    if (!feeType || feeType.institutionId !== institutionId) {
      throw new NotFoundException('Fee Type not found or invalid for this institution.');
    }

    // 2. Perform uniqueness check if name is being updated
    if (dto.name && dto.name !== feeType.name) {
      const existingFeeType = await this.prisma.feeType.findFirst({
        where: { name: dto.name, institutionId, NOT: { id } },
      });
      if (existingFeeType) {
        throw new BadRequestException(`A fee type named "${dto.name}" already exists.`);
      }
    }

    // 3. Perform the update
    return this.prisma.feeType.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * GM deletes a fee category.
   * CRITICAL: Block deletion if it is linked to any price definitions (LevelFee).
   */
  async delete(institutionId: string, id: string) {
    // 1. Validate existence and ownership, and check for linked price definitions
    const feeType = await this.prisma.feeType.findUnique({
      where: { id },
      include: { 
        levelFees: { select: { levelId: true }, take: 1 } // Check for LevelFee links
      },
    });

    if (!feeType || feeType.institutionId !== institutionId) {
      throw new NotFoundException('Fee Type not found or invalid for this institution.');
    }

    // 2. CRITICAL: Block deletion if in use
    if (feeType.levelFees.length > 0) {
      throw new BadRequestException(`Cannot delete Fee Type "${feeType.name}". It is currently part of ${feeType.levelFees.length} price configurations.`);
    }

    // 3. Perform the delete
    await this.prisma.feeType.delete({ where: { id } });

    return { message: `Fee Type "${feeType.name}" deleted successfully.` };
  }
}