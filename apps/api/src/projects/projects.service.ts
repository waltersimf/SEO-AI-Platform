import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        domain: dto.domain,
        organizationId,
        targetKeywords: dto.targetKeywords || [],
        competitors: dto.competitors || [],
        gscPropertyUrl: dto.gscPropertyUrl,
        gaPropertyId: dto.gaPropertyId,
      },
    });

    return project;
  }

  async findAll(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.isDeleted) {
      throw new NotFoundException('Project not found');
    }

    if (project.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(id: string, organizationId: string, dto: UpdateProjectDto) {
    // First verify the project exists and belongs to the organization
    await this.findOne(id, organizationId);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.targetKeywords !== undefined && { targetKeywords: dto.targetKeywords }),
        ...(dto.competitors !== undefined && { competitors: dto.competitors }),
        ...(dto.gscPropertyUrl !== undefined && { gscPropertyUrl: dto.gscPropertyUrl }),
        ...(dto.gaPropertyId !== undefined && { gaPropertyId: dto.gaPropertyId }),
        ...(dto.serpstatProjectId !== undefined && { serpstatProjectId: dto.serpstatProjectId }),
        // Payment fields
        ...(dto.paymentStatus !== undefined && { paymentStatus: dto.paymentStatus }),
        ...(dto.paymentDueDate !== undefined && { paymentDueDate: new Date(dto.paymentDueDate) }),
        ...(dto.budgetTotal !== undefined && { budgetTotal: dto.budgetTotal }),
        ...(dto.budgetSpent !== undefined && { budgetSpent: dto.budgetSpent }),
        ...(dto.lastPaymentDate !== undefined && { lastPaymentDate: new Date(dto.lastPaymentDate) }),
      },
    });

    return project;
  }

  async softDelete(id: string, organizationId: string) {
    // First verify the project exists and belongs to the organization
    await this.findOne(id, organizationId);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Project deleted successfully',
      projectId: project.id,
    };
  }

  /**
   * Update payment status for a project
   */
  async updatePaymentStatus(id: string, organizationId: string, dto: UpdatePaymentStatusDto) {
    // First verify the project exists and belongs to the organization
    await this.findOne(id, organizationId);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.paymentStatus !== undefined && { paymentStatus: dto.paymentStatus }),
        ...(dto.paymentDueDate !== undefined && { paymentDueDate: new Date(dto.paymentDueDate) }),
        ...(dto.budgetTotal !== undefined && { budgetTotal: dto.budgetTotal }),
        ...(dto.budgetSpent !== undefined && { budgetSpent: dto.budgetSpent }),
        ...(dto.lastPaymentDate !== undefined && { lastPaymentDate: new Date(dto.lastPaymentDate) }),
      },
    });

    return project;
  }

  /**
   * Check and auto-update overdue projects
   * Can be called by a cron job or on fetch
   */
  async checkOverdueProjects(organizationId: string) {
    const updated = await this.prisma.project.updateMany({
      where: {
        organizationId,
        paymentStatus: 'unpaid',
        paymentDueDate: { lt: new Date() },
      },
      data: {
        paymentStatus: 'overdue',
      },
    });

    return { updatedCount: updated.count };
  }
}
