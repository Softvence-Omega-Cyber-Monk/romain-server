// src/level/level.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto'; // <-- Added this import

@Injectable()
export class LevelService {
  constructor(private prisma: PrismaService) {}

  /**
   * GM creates a new Level (class) within an existing Programme.
   */
  async create(institutionId: string, dto: CreateLevelDto) {
    // 1. Validate Programme existence and ownership
    const programme = await this.prisma.programme.findUnique({
      where: { id: dto.programmeId },
      include: { session: true },
    });

    if (!programme || programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Programme not found or does not belong to your institution.');
    }

    // 2. Check for duplicate name within the Programme
    const existingLevel = await this.prisma.level.findFirst({
      where: { name: dto.name, programmeId: dto.programmeId },
    });
    if (existingLevel) {
      throw new BadRequestException(`A Level named "${dto.name}" already exists in this Programme.`);
    }

    // 3. Create the Level
    return this.prisma.level.create({
      data: {
        name: dto.name,
        programmeId: dto.programmeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * GM gets all Levels for a specific Programme (e.g., list all classes in Science).
   */
  async getProgrammeLevels(institutionId: string, programmeId: string) {
    // Validate Programme ownership
    const programme = await this.prisma.programme.findUnique({
      where: { id: programmeId },
      include: { session: true },
    });

    if (!programme || programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Programme not found or does not belong to your institution.');
    }

    return this.prisma.level.findMany({
      where: { programmeId },
      orderBy: { name: 'asc' },
    });
  }

  // ------------------------------------------------------------------
  // NEW METHODS: UPDATE AND DELETE
  // ------------------------------------------------------------------

  /**
   * GM updates a Level's details (e.g., renaming the class).
   */
  async updateLevel(institutionId: string, levelId: string, dto: UpdateLevelDto) {
    // 1. Validate Level existence and ownership
    const level = await this.prisma.level.findUnique({
      where: { id: levelId },
      include: { programme: { include: { session: true } } },
    });

    if (!level || level.programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Academic Level not found or does not belong to your institution.');
    }

    // 2. Perform uniqueness check if name is being updated
    if (dto.name && dto.name !== level.name) {
      const existingLevel = await this.prisma.level.findFirst({
        where: { name: dto.name, programmeId: level.programmeId, NOT: { id: levelId } },
      });
      if (existingLevel) {
        throw new BadRequestException(`A Level named "${dto.name}" already exists in this Programme.`);
      }
    }

    // 3. Perform the update
    return this.prisma.level.update({
      where: { id: levelId },
      data: dto,
    });
  }

  /**
   * GM deletes a Level.
   * CRITICAL: Block deletion if students or fee configurations are linked.
   */
  async deleteLevel(institutionId: string, levelId: string) {
    // 1. Validate Level existence and ownership, and check for linked students/fees
    const level = await this.prisma.level.findUnique({
      where: { id: levelId },
      include: { 
        programme: { include: { session: true } }, 
        Student: { select: { id: true }, take: 1 },    // Check for linked students
        LevelFee: { select: { levelId: true }, take: 1 }, // Check for linked fee configurations
      },
    });

    if (!level || level.programme.session.institutionId !== institutionId) {
      throw new NotFoundException('Academic Level not found or does not belong to your institution.');
    }
    
    // 2. CRITICAL: Block deletion if in use
    if (level.Student.length > 0) {
      throw new BadRequestException('Cannot delete Level. Students are currently enrolled in this class.');
    }
    if (level.LevelFee.length > 0) {
      throw new BadRequestException('Cannot delete Level. It has defined fee structures.');
    }

    // 3. Perform the delete
    await this.prisma.level.delete({ where: { id: levelId } });

    return { message: `Level "${level.name}" deleted successfully.` };
  }
}