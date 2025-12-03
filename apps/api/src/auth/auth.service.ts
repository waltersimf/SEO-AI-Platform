import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(data: {
    email: string;
    name: string;
    password: string;
    organizationName: string;
  }) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Check if organization exists (case-insensitive)
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        name: {
          equals: data.organizationName,
          mode: 'insensitive', // Case-insensitive search
        },
      },
    });

    let user;

    if (existingOrg) {
      // JOIN existing organization
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          jobRole: 'seo',
          role: Role.MEMBER, // Users joining existing org get MEMBER role
          organizationId: existingOrg.id, // Link to existing org
        },
        include: {
          organization: true,
        },
      });
    } else {
      // CREATE new organization (current behavior)
      // Generate organization slug (with random suffix for uniqueness)
      const slug = `${data.organizationName}-${randomBytes(4).toString('hex')}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          jobRole: 'admin',
          role: Role.OWNER, // Organization creator is OWNER
          organization: {
            create: {
              name: data.organizationName,
              slug,
            },
          },
        },
        include: {
          organization: true,
        },
      });
    }

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }
}