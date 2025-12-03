import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Role } from '@prisma/client';

@Injectable()
export class InviteService {
  constructor(private prisma: PrismaService) {}

  async createInvite(
    dto: CreateInviteDto,
    userId: string,
    organizationId: string,
  ) {
    // Check if user with this email already exists in the organization
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        organizationId,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in the organization',
      );
    }

    // Check for existing pending invite
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        email: dto.email,
        organizationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        'An active invite already exists for this email',
      );
    }

    // Generate unique token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await this.prisma.invite.create({
      data: {
        email: dto.email,
        token,
        role: dto.role as Role,
        organizationId,
        invitedById: userId,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return invite;
  }

  async listPendingInvites(organizationId: string) {
    return this.prisma.invite.findMany({
      where: {
        organizationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(inviteId: string, organizationId: string) {
    const invite = await this.prisma.invite.findFirst({
      where: {
        id: inviteId,
        organizationId,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.usedAt) {
      throw new BadRequestException('Invite has already been used');
    }

    await this.prisma.invite.delete({
      where: { id: inviteId },
    });

    return { message: 'Invite revoked successfully' };
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.usedAt) {
      throw new BadRequestException('Invite has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('Invite has expired');
    }

    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.usedAt) {
      throw new BadRequestException('Invite has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('Invite has expired');
    }

    // Get the current user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email matches
    if (user.email !== invite.email) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    // Check if user is already in an organization (they might need to leave first)
    // For now, we'll update the user to the new organization
    // In a real app, you might want to handle this differently

    // Update user to new organization with the invited role
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });

    // Mark invite as used
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return {
      message: 'Invite accepted successfully',
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
      },
      role: invite.role,
    };
  }
}
