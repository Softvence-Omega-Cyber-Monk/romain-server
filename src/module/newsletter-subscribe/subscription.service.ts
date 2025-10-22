import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/create-subscription.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SubscriptionStatus } from '@prisma/client';


@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const existing = await this.prisma.subscriptionEmail.findUnique({
      where: { email:createSubscriptionDto.email },
    });
    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        return this.prisma.subscriptionEmail.update({
          where: { email:createSubscriptionDto.email },
          data: { status: 'ACTIVE' },
        });
      }
      throw new BadRequestException('This email is already subscribed.');
    }

    return this.prisma.subscriptionEmail.create({
      data: {
        email:createSubscriptionDto.email,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: SubscriptionStatus;
  }) {
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 20;
    const where: Prisma.SubscriptionEmailWhereInput = {};
    if (params?.status) {
      where.status = params.status ;
    }

    const [items, total] = await Promise.all([
      this.prisma.subscriptionEmail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.subscriptionEmail.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  // Get one by id
  async findOne(id: string) {
    const item = await this.prisma.subscriptionEmail.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Subscription not found');
    return item;
  }

  // Update (admin)
  async update(id: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id);

    const data: Prisma.SubscriptionEmailUpdateInput = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.email !== undefined) {
      data.email = dto.email.trim().toLowerCase();
    }

    return this.prisma.subscriptionEmail.update({
      where: { id },
      data,
    });
  }

  // Unsubscribe by email (public)
  async unsubscribe(email: string) {
    const getEmail = email.trim().toLowerCase();
    console.log("getEmail----------->", getEmail);
    const existing = await this.prisma.subscriptionEmail.findUnique({
      where: { email: getEmail },
    });
    if (!existing) throw new NotFoundException('Subscription not found');

    return this.prisma.subscriptionEmail.update({
      where: { email: getEmail },
      data: { status: 'UNSUBSCRIBED' },
    });
  }

  // Delete (admin)
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subscriptionEmail.delete({ where: { id } });
  }

}
