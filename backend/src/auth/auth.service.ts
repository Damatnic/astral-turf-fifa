import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Session } from '../users/entities/session.entity';
import { SessionService } from '../redis/session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>
  ) {}

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...result } = user;
    return result;
  }

  async register(registerDto: RegisterDto): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: registerDto.role || UserRole.PLAYER,
      phoneNumber: registerDto.phoneNumber,
    });

    const tokens = await this.generateTokens(user);
    await this.createSession(user.id, tokens.refreshToken, tokens.accessToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user as User);
    await this.createSession(user.id, tokens.refreshToken, tokens.accessToken);

    return {
      user,
      tokens,
    };
  }

  async logout(userId: string, refreshToken: string, accessToken?: string): Promise<void> {
    // Delete session (works with both Redis and PostgreSQL)
    const session = await this.sessionsRepository.findOne({
      where: { userId, refreshToken },
    });

    if (session) {
      await this.sessionService.deleteSession(session.id);
    }

    // Blacklist access token for immediate invalidation (Redis only)
    if (accessToken) {
      const accessTokenTtl = this.getTokenTtl(accessToken);
      if (accessTokenTtl > 0) {
        await this.sessionService.blacklistToken(accessToken, accessTokenTtl);
      }
    }
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const session = await this.sessionsRepository.findOne({
        where: {
          userId: payload.sub,
          refreshToken,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findOne(payload.sub);

      // Delete old session
      await this.sessionsRepository.delete(session.id);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Create new session
      await this.createSession(user.id, tokens.refreshToken, tokens.accessToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Check if an access token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.sessionService.isTokenBlacklisted(token);
  }

  /**
   * Get remaining TTL for a token (in seconds)
   */
  private getTokenTtl(token: string): number {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number };
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;
      return ttl > 0 ? ttl : 0;
    } catch {
      return 0;
    }
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    _accessToken: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Try to use SessionService (Redis-first with PostgreSQL fallback)
    try {
      await this.sessionService.createSession({
        userId,
        refreshToken,
        expiresAt,
      });
    } catch {
      // If SessionService fails, fallback to direct PostgreSQL
      await this.sessionsRepository.save({
        userId,
        refreshToken,
        expiresAt,
      });
    }
  }
}
