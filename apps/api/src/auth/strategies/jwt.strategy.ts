import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Custom extractor that checks query param first, then auth header
const extractJwtFromQueryOrHeader = (req: any) => {
  // First try query parameter (for OAuth redirect flows)
  if (req.query && req.query.token) {
    return req.query.token;
  }
  // Fall back to Authorization header
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is required but not defined in environment variables');
    }

    super({
      jwtFromRequest: extractJwtFromQueryOrHeader,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}