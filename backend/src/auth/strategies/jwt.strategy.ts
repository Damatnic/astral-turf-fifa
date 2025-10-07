import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../../redis/session.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private sessionService: SessionService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(request: Request, payload: { sub: string; email: string; role: string }) {
    // Extract token from header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    // Check if token is blacklisted (Redis only, no error if Redis unavailable)
    if (token) {
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
