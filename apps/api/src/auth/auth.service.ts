import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto'; // ← ДОДАНО для унікальних slugs
import { PrismaService } from '../prisma/prisma.service';

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

    // Generate organization slug (with random suffix for uniqueness)
    // ✅ ВИПРАВЛЕННЯ: randomBytes гарантує що slug ЗАВЖДИ унікальний!
    const slug = `${data.organizationName}-${randomBytes(4).toString('hex')}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Create organization and user in transaction
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: 'admin', // First user is admin
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

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
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