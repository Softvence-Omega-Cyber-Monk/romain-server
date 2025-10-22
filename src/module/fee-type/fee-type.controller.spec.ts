import { Test, TestingModule } from '@nestjs/testing';
import { FeeTypeController } from './fee-type.controller';
import { FeeTypeService } from './fee-type.service';

describe('FeeTypeController', () => {
  let controller: FeeTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeeTypeController],
      providers: [FeeTypeService],
    }).compile();

    controller = module.get<FeeTypeController>(FeeTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
