import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatusEnum, CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContactMessage, Prisma } from '@prisma/client';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto): Promise<ContactMessage> {
    const data: Prisma.ContactMessageCreateInput = {
      name: dto.name ?? null,
      email: dto.email.trim(),
      phone: dto.phone ?? null,
      subject: dto.subject ?? null,
      message: dto.message,
    };

    const created = await this.prisma.contactMessage.create({ data });

    // TODO: notify support/admin via email/slack here (non-blocking)
    // await this.notifyAdmin(created);

    return created;
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: ContactStatusEnum;
  }) {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 20;

    const where: Prisma.ContactMessageWhereInput = {};
    if (params?.status) {
      where.status = params.status;
    }
    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  // Get single message by id
  async findOne(id: string): Promise<ContactMessage> {
    const item = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Contact message not found');
    return item;
  }

  // Update message (admin) — supports partial updates
  async update(id: string, dto: UpdateContactDto): Promise<ContactMessage> {
    // ensure exists
    await this.findOne(id);

    const data: Prisma.ContactMessageUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email.trim();
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.subject !== undefined) data.subject = dto.subject;
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.status !== undefined) data.status = dto.status ;

    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data,
    });

    // TODO: optionally notify user when replied
    return updated;
  }

  // Delete message (admin)
  async remove(id: string): Promise<ContactMessage> {
    await this.findOne(id);
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}
