import { Test, TestingModule } from '@nestjs/testing';
import { LevelFeeService } from './level-fee.service';

describe('LevelFeeService', () => {
  let service: LevelFeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LevelFeeService],
    }).compile();

    service = module.get<LevelFeeService>(LevelFeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
