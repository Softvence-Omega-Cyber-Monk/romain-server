import { Module } from '@nestjs/common';
import { LevelFeeService } from './level-fee.service';
import { LevelFeeController } from './level-fee.controller';

@Module({
  controllers: [LevelFeeController],
  providers: [LevelFeeService],
})
export class LevelFeeModule {}
