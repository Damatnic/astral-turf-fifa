import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Session } from '../users/entities/session.entity';
import { SessionService } from '../redis/session.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
    private mailService: MailService,
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
    message: string;
  }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Set token expiration (24 hours from now)
    const tokenExpiry = new Date();
    const expiryHours = this.configService.get<number>('EMAIL_VERIFICATION_EXPIRY', 86400) / 3600;
    tokenExpiry.setHours(tokenExpiry.getHours() + expiryHours);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: registerDto.role || UserRole.PLAYER,
      phoneNumber: registerDto.phoneNumber,
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: tokenExpiry,
    });

    // Send verification email
    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
        `${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      message: 'Registration successful! Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: Omit<User, 'password'> & { emailVerified: boolean };
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
      user: {
        ...user,
        emailVerified: (user as User).emailVerified,
      },
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
   * Verify user's email with token
   */
  async verifyEmail(token: string): Promise<{ message: string; user: Omit<User, 'password'> }> {
    // Find user with non-expired verification token
    const users = await this.usersService.findAll();
    let verifiedUser: User | null = null;

    for (const user of users) {
      if (
        user.emailVerificationToken &&
        user.emailVerificationExpires &&
        user.emailVerificationExpires > new Date()
      ) {
        const isValidToken = await bcrypt.compare(token, user.emailVerificationToken);
        if (isValidToken) {
          verifiedUser = user;
          break;
        }
      }
    }

    if (!verifiedUser) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (verifiedUser.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Update user - mark as verified and clear token
    await this.usersService.update(verifiedUser.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });

    // Send welcome email
    try {
      await this.mailService.sendWelcomeEmail(
        verifiedUser.email,
        `${verifiedUser.firstName} ${verifiedUser.lastName}`
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, emailVerificationToken, ...userWithoutSensitiveData } = verifiedUser;

    return {
      message: 'Email verified successfully! You can now log in.',
      user: { ...userWithoutSensitiveData, emailVerified: true },
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const hashedToken = await bcrypt.hash(verificationToken, 10);

    // Set new token expiration
    const tokenExpiry = new Date();
    const expiryHours = this.configService.get<number>('EMAIL_VERIFICATION_EXPIRY', 86400) / 3600;
    tokenExpiry.setHours(tokenExpiry.getHours() + expiryHours);

    // Update user with new token
    await this.usersService.update(user.id, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: tokenExpiry,
    });

    // Send verification email
    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
        `${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return { message: 'Verification email sent successfully!' };
  }

  /**
   * Generate a cryptographically secure verification token
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
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

  /**
   * Request password reset - sends email with reset token
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.usersService.findByEmail(email);

    // Always return generic message for security (don't reveal if email exists)
    const genericMessage =
      'If an account exists with this email, a password reset link has been sent.';

    if (!user) {
      // Log for debugging but don't reveal to user
      this.sessionService['logger']?.log(
        `Password reset requested for non-existent email: ${email}`
      );
      return { message: genericMessage };
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken(); // Reuse token generation
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Set token expiration (1 hour from now)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    // Save hashed token to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = tokenExpiry;
    await this.usersService.update(user.id, user);

    // Send password reset email
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        `${user.firstName} ${user.lastName}`
      );
    } catch (error) {
      // Log error but still return success to prevent email enumeration
      this.sessionService['logger']?.error(
        `Failed to send password reset email to ${email}`,
        error
      );
    }

    return { message: genericMessage };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Find users with non-expired reset tokens
    const users = await this.usersService.findAll();
    const now = new Date();

    let userToReset: User | null = null;

    // Find user with matching token
    for (const user of users) {
      if (user.passwordResetToken && user.passwordResetExpires && user.passwordResetExpires > now) {
        const isValidToken = await bcrypt.compare(token, user.passwordResetToken);
        if (isValidToken) {
          userToReset = user;
          break;
        }
      }
    }

    if (!userToReset) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    userToReset.password = hashedPassword;
    userToReset.passwordResetToken = undefined;
    userToReset.passwordResetExpires = undefined;
    await this.usersService.update(userToReset.id, userToReset);

    // Invalidate all user's sessions (force re-login)
    await this.invalidateAllUserSessions(userToReset.id);

    // Send password changed confirmation email
    try {
      await this.mailService.sendPasswordChangedEmail(
        userToReset.email,
        `${userToReset.firstName} ${userToReset.lastName}`
      );
    } catch (error) {
      // Log error but don't fail the password reset
      this.sessionService['logger']?.error(
        `Failed to send password changed email to ${userToReset.email}`,
        error
      );
    }

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Invalidate all sessions for a user (used when password is reset)
   */
  private async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      // Delete all database sessions
      await this.sessionsRepository.delete({ userId });

      // Clear all Redis sessions for this user
      await this.sessionService.deleteUserSessions(userId);

      this.sessionService['logger']?.log(`All sessions invalidated for user ${userId}`);
    } catch (error) {
      this.sessionService['logger']?.error(
        `Failed to invalidate sessions for user ${userId}`,
        error
      );
      // Don't throw - session cleanup is best effort
    }
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
