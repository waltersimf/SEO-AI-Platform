import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getTeamMembers(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobRole: true,
        avatar: true,
        isAI: true,
        isOnline: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, MEMBER, VIEWER
        { name: 'asc' },
      ],
    });
  }

  async updateMemberRole(
    targetUserId: string,
    newRole: Role,
    currentUserId: string,
    organizationId: string,
  ) {
    // Get current user
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Only OWNER and ADMIN can change roles
    if (currentUser.role !== Role.OWNER && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only OWNER or ADMIN can change roles');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.organizationId !== organizationId) {
      throw new NotFoundException('User not found in this organization');
    }

    if (targetUser.isDeleted) {
      throw new BadRequestException('Cannot modify a deleted user');
    }

    // Cannot change OWNER role
    if (targetUser.role === Role.OWNER) {
      throw new ForbiddenException('Cannot change the role of the organization owner');
    }

    // Cannot change own role to lower level
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    // ADMIN cannot promote to OWNER
    if (currentUser.role === Role.ADMIN && newRole === Role.OWNER) {
      throw new ForbiddenException('Only OWNER can promote someone to OWNER');
    }

    // ADMIN cannot demote another ADMIN
    if (currentUser.role === Role.ADMIN && targetUser.role === Role.ADMIN) {
      throw new ForbiddenException('ADMIN cannot change role of another ADMIN');
    }

    // Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobRole: true,
        avatar: true,
        isAI: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  async removeMember(
    targetUserId: string,
    currentUserId: string,
    organizationId: string,
  ) {
    // Get current user
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Only OWNER and ADMIN can remove members
    if (currentUser.role !== Role.OWNER && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only OWNER or ADMIN can remove members');
    }

    // Get target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.organizationId !== organizationId) {
      throw new NotFoundException('User not found in this organization');
    }

    if (targetUser.isDeleted) {
      throw new BadRequestException('User is already removed');
    }

    // Cannot remove OWNER
    if (targetUser.role === Role.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    // Cannot remove yourself
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot remove yourself from the organization');
    }

    // ADMIN cannot remove another ADMIN
    if (currentUser.role === Role.ADMIN && targetUser.role === Role.ADMIN) {
      throw new ForbiddenException('ADMIN cannot remove another ADMIN');
    }

    // Soft delete - set isDeleted=true
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Member removed successfully' };
  }
}
