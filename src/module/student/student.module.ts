import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { StudentIdService } from './student-id.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService,StudentIdService],
})
export class StudentModule {}
