import { Test, TestingModule } from '@nestjs/testing';
import { FeeTypeService } from './fee-type.service';

describe('FeeTypeService', () => {
  let service: FeeTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeeTypeService],
    }).compile();

    service = module.get<FeeTypeService>(FeeTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
