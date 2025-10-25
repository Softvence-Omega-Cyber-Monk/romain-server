import { Test, TestingModule } from '@nestjs/testing';
import { StudentDebtService } from './student-debt.service';

describe('StudentDebtService', () => {
  let service: StudentDebtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentDebtService],
    }).compile();

    service = module.get<StudentDebtService>(StudentDebtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
