import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

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
  async logout(@CurrentUser() user: { id: string }, @Body('refreshToken') refreshToken: string) {
    await this.authService.logout(user.id, refreshToken);
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
}
