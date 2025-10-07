import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Request as ExpressRequest } from 'express';

@Controller('auth')
@UseGuards(JwtAuthGuard) // Apply JWT auth globally to all auth routes
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // Mark as public route
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public() // Mark as public route
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: { id: string },
    @Body('refreshToken') refreshToken: string,
    @Request() req: ExpressRequest
  ) {
    // Extract access token from Authorization header
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const accessToken =
      typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;

    await this.authService.logout(user.id, refreshToken, accessToken);
    return { message: 'Logged out successfully' };
  }

  @Public() // Mark as public route
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@CurrentUser() user: { id: string; email: string; role: string }) {
    return { user };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }
}
