// src/student-debt/dto/generate-debt.dto.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateInitialDebtDto {
  @IsNotEmpty()
  @IsUUID()
  studentProfileId: string;

  @IsNotEmpty()
  @IsUUID()
  levelId: string;
}