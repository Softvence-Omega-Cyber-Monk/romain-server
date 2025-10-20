import { Controller } from '@nestjs/common';
import { ProgrammeService } from './programme.service';

@Controller('programme')
export class ProgrammeController {
  constructor(private readonly programmeService: ProgrammeService) {}
}
