import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { StudentIdService } from './student-id.service';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { StudentDebtModule } from '../student-debt/student-debt.module';
// import { UserService } from '../user/user.service';

@Module({
   imports: [
    UserModule,
    StudentDebtModule,              // <-- add this line
  ],
  controllers: [StudentController],
  providers: [StudentService,StudentIdService,UserService],
})
export class StudentModule {}
