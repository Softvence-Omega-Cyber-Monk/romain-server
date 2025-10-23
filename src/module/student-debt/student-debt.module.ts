import { Module } from '@nestjs/common';
import { StudentDebtService } from './student-debt.service';
import { StudentDebtController } from './student-debt.controller';

@Module({
  controllers: [StudentDebtController],
  providers: [StudentDebtService],
   exports: [StudentDebtService]  
})
export class StudentDebtModule {}
