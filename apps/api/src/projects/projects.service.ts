import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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
}
