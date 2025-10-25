import { Test, TestingModule } from '@nestjs/testing';
import { StudentDebtController } from './student-debt.controller';
import { StudentDebtService } from './student-debt.service';

describe('StudentDebtController', () => {
  let controller: StudentDebtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentDebtController],
      providers: [StudentDebtService],
    }).compile();

    controller = module.get<StudentDebtController>(StudentDebtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
