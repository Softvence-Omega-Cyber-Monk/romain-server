import { Controller } from '@nestjs/common';
import { StudentDebtService } from './student-debt.service';

@Controller('student-debt')
export class StudentDebtController {
  constructor(private readonly studentDebtService: StudentDebtService) {}
}
