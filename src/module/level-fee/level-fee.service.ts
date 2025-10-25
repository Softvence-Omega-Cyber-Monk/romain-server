// src/level-fee/level-fee.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLevelFeeDto } from './dto/create-level-fee.dto';
import { UpdateLevelFeeDto } from './dto/update-level-fee.dto';

@Injectable()
export class LevelFeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to validate Level and FeeType ownership by Institution
   */
  private async validateEntities(institutionId: string, levelId: string, feeTypeId: string) {
    const level = await this.prisma.level.findUnique({
      where: { id: levelId },
      include: { programme: { include: { session: true } } },
    });

    if (!level || level.programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Academic Level not found or invalid for this institution.');
    }

    const feeType = await this.prisma.feeType.findUnique({
      where: { id: feeTypeId },
    });

    if (!feeType || feeType.institutionId !== institutionId) {
      throw new NotFoundException('Fee Type not found or invalid for this institution.');
    }
    
    return { levelName: level.name, feeTypeName: feeType.name };
  }

  /**
   * GM assigns a specific fee category (FeeType) and its amount to a Level.
   * This defines the price structure.
   */
  async create(institutionId: string, dto: CreateLevelFeeDto) {
    const { levelName, feeTypeName } = await this.validateEntities(
      institutionId, 
      dto.levelId, 
      dto.feeTypeId
    );

    // Check for duplicate assignment (using the composite unique key)
    const existingLevelFee = await this.prisma.levelFee.findUnique({
      where: {
        levelId_feeTypeId: {
          levelId: dto.levelId,
          feeTypeId: dto.feeTypeId,
        },
      },
    });

    if (existingLevelFee) {
      throw new BadRequestException(`The fee type "${feeTypeName}" is already priced for the Level "${levelName}".`);
    }

    // Create the LevelFee (Price definition)
    return this.prisma.levelFee.create({
      data: {
        levelId: dto.levelId,
        feeTypeId: dto.feeTypeId,
        amount: dto.amount,
      },
      include: { feeType: true, level: true },
    });
  }

  /**
   * GM retrieves the complete fee price breakdown for a specific Level.
   */
  async getFeesByLevel(institutionId: string, levelId: string) {
      // Validate Level ownership first (reusing part of validateEntities logic)
      const level = await this.prisma.level.findUnique({
          where: { id: levelId },
          include: { programme: { include: { session: true } } },
      });

      if (!level || level.programme.session.institutionId !== institutionId) {
          throw new NotFoundException('Level not found or does not belong to your institution.');
      }
      
      return this.prisma.levelFee.findMany({
          where: { levelId },
          // Include FeeType and Level details for context
          include: { feeType: true, level: true }, 
          orderBy: { amount: 'desc' },
      });
  }

  /**
   * GM updates the price of a specific LevelFee item.
   */
  async updatePrice(institutionId: string, levelId: string, feeTypeId: string, dto: UpdateLevelFeeDto) {
      await this.validateEntities(institutionId, levelId, feeTypeId);

      return this.prisma.levelFee.update({
          where: {
              levelId_feeTypeId: { levelId, feeTypeId },
          },
          data: { amount: dto.amount },
          include: { feeType: true, level: true },
      });
  }
  
  /**
   * GM deletes a fee price assignment from a Level.
   * CRITICAL: Block deletion if students have been invoiced (StudentDebt exists).
   */
  async deletePrice(institutionId: string, levelId: string, feeTypeId: string) {
      const levelFee = await this.prisma.levelFee.findUnique({
          where: { levelId_feeTypeId: { levelId, feeTypeId } },
          include: { 
              level: { include: { programme: { include: { session: true } } } },
              studentDebts: { select: { studentProfileId: true }, take: 1 } // Check for existing debt
          },
      });

      // 1. Validate existence and ownership
      if (!levelFee || levelFee.level.programme.session.institutionId !== institutionId) {
          throw new NotFoundException('Fee price configuration not found or invalid for this institution.');
      }

      // 2. CRITICAL: Block deletion if students have been invoiced
      if (levelFee.studentDebts.length > 0) {
          throw new BadRequestException('Cannot delete this price configuration. Students have already been invoiced based on this fee.');
      }

      // 3. Perform the delete
      await this.prisma.levelFee.delete({
          where: { levelId_feeTypeId: { levelId, feeTypeId } },
      });
      
      return { message: `Fee price removed successfully from Level ${levelFee.level.name}.` };
  }
}