import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@Req() req) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.findAll(organizationId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.create(organizationId, dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.findOne(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.update(id, organizationId, dto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async delete(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.softDelete(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
