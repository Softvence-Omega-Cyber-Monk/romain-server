import { Module } from '@nestjs/common';
import { FeeTypeService } from './fee-type.service';
import { FeeTypeController } from './fee-type.controller';

@Module({
  controllers: [FeeTypeController],
  providers: [FeeTypeService],
})
export class FeeTypeModule {}
