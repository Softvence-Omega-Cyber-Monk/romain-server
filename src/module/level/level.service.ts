// // src/level/level.service.ts
// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateLevelDto } from './dto/create-level.dto';
// import { UpdateLevelDto } from './dto/update-level.dto';

// @Injectable()
// export class LevelService {
//   constructor(private prisma: PrismaService) {}

//   async create(institutionId: string, dto: CreateLevelDto) {
//     // 1. Validate Programme existence and ownership (via Programme's Session)
//     const programme = await this.prisma.programme.findUnique({
//       where: { id: dto.programmeId },
//       include: { session: true },
//     });

//     if (!programme || programme.session.institutionId !== institutionId) {
//       throw new NotFoundException('Programme not found or does not belong to your institution.');
//     }

//     // 2. Check for duplicate name within the same Programme
//     const existingLevel = await this.prisma.level.findFirst({
//         where: { name: dto.name, programmeId: dto.programmeId }
//     });
//     if (existingLevel) {
//         throw new BadRequestException(`A Level named "${dto.name}" already exists in this Programme.`);
//     }

//     // 3. Create the Level (Fee defined here)
//     return this.prisma.level.create({
//       data: {
//         name: dto.name,
//         coast: dto.coast,
//         programmeId: dto.programmeId,
//       },
//     });
//   }

//   // Gets levels for a specific programme, ensuring ownership
//   async getProgrammeLevels(institutionId: string, programmeId: string) {
//       const programme = await this.prisma.programme.findUnique({
//           where: { id: programmeId },
//           include: { session: true, levels: true }
//       });

//       if (!programme || programme.session.institutionId !== institutionId) {
//           throw new NotFoundException('Programme not found or does not belong to your institution.');
//       }
//       return programme.levels;
//   }
  
//   async updateLevel(institutionId: string, levelId: string, dto: UpdateLevelDto) {
//     // 1. Validate Level existence and ownership (via Programme's Session)
//     const level = await this.prisma.level.findUnique({
//         where: { id: levelId },
//         include: { programme: { include: { session: true } } }
//     });

//     if (!level || level.programme.session.institutionId !== institutionId) {
//         throw new NotFoundException('Level not found or does not belong to your institution.');
//     }

//     // 2. Name uniqueness check if name is being updated
//     if (dto.name) {
//         const existingLevel = await this.prisma.level.findFirst({
//             where: { 
//                 name: dto.name, 
//                 programmeId: level.programmeId,
//                 NOT: { id: levelId }
//             },
//         });
//         if (existingLevel) {
//             throw new BadRequestException(`A Level named "${dto.name}" already exists in this Programme.`);
//         }
//     }

//     // 3. Perform update
//     return this.prisma.level.update({
//         where: { id: levelId },
//         data: dto,
//     });
//   }

//   async deleteLevel(institutionId: string, levelId: string) {
//     // 1. Validate Level existence and ownership
//     const level = await this.prisma.level.findUnique({
//         where: { id: levelId },
//         include: { 
//             programme: { include: { session: true } },
//             students: { select: { id: true } } // CRITICAL: Check for linked students
//         }
//     });

//     if (!level || level.programme.session.institutionId !== institutionId) {
//         throw new NotFoundException('Level not found or does not belong to your institution.');
//     }

//     // 2. CRITICAL: Block deletion if students are or were ever enrolled in this level
//     if (level.students.length > 0) {
//         throw new BadRequestException('Cannot delete Level. It is linked to existing student records, which is necessary for historical data and financial integrity.');
//     }

//     // 3. Perform delete
//     await this.prisma.level.delete({ where: { id: levelId } });

//     return { message: `Level ${level.name} deleted successfully.` };
//   }
// }