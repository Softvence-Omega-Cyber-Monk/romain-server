import { Test, TestingModule } from '@nestjs/testing';
import { LevelFeeController } from './level-fee.controller';
import { LevelFeeService } from './level-fee.service';

describe('LevelFeeController', () => {
  let controller: LevelFeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LevelFeeController],
      providers: [LevelFeeService],
    }).compile();

    controller = module.get<LevelFeeController>(LevelFeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
