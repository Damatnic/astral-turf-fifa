import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply auth and role guards globally
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COACH) // Only admins and coaches can view all users
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.FAMILY) // All authenticated users
  getProfile(@CurrentUser() user: { id: string }): Promise<User> {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH) // Only admins and coaches can view specific users
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH) // Only admins and coaches can update users
  update(@Param('id') id: string, @Body() updateData: Partial<User>): Promise<User> {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Only admins can delete users
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
