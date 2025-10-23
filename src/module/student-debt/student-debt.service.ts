// src/student-debt/student-debt.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client'; // Import Prisma for transaction
import { GenerateInitialDebtDto } from './dto/generate-debt.dto';

@Injectable()
export class StudentDebtService {
  constructor(private prisma: PrismaService) {}

  /**
   * Automatically generates all StudentDebt records for a new student based on their LevelFee configuration.
   * This is the auto-invoicing mechanism.
   */
  async generateInitialDebt(dto: GenerateInitialDebtDto,tx: Prisma.TransactionClient) {
    const { studentProfileId, levelId } = dto;

    // 1. Get the price list (LevelFee) for the student's Level
    const levelFees = await tx.levelFee.findMany({
      where: { levelId },
    });

    if (levelFees.length === 0) {
      // It's not an error that blocks enrollment, but it's important to log.
      console.warn(`No LevelFee configurations found for Level ID: ${levelId}. Student enrolled with zero debt.`);
      return; // No fees to generate
    }

    // 2. Prepare the data payload for bulk creation
    const debtRecords: Prisma.StudentDebtCreateManyInput[] = levelFees.map(lf => ({
      studentProfileId: studentProfileId,
      levelId: lf.levelId,
      feeTypeId: lf.feeTypeId,
      initialAmount: lf.amount, // Copy the price as the initial debt
      amountPaid: new Prisma.Decimal(0), // Start with zero paid
    }));

    // 3. Insert all debt records in one transaction
    try {
      await tx.studentDebt.createMany({
        data: debtRecords,
        skipDuplicates: true, // Should not happen here, but good safeguard
      });
      console.log(`Successfully generated ${debtRecords.length} debt items for student ${studentProfileId}.`);
    } catch (error) {
      // CRITICAL: If this fails, the financial ledger is incomplete.
      console.error('Failed to generate student debt:', error);
      throw new InternalServerErrorException('Financial setup failed during enrollment.');
    }
  }

  // Future methods: findOutstandingDebtByStudent, findDebtById, etc.
}