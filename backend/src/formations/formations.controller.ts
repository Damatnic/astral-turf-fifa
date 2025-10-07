import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreateFormationPositionDto } from './dto/create-formation-position.dto';
import { UpdateFormationPositionDto } from './dto/update-formation-position.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { FormationShape } from './entities/formation.types';

@Controller('formations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  /**
   * FORMATION CRUD ENDPOINTS
   */

  // Create a new formation
  @Post()
  @Roles(UserRole.ADMIN, UserRole.COACH)
  create(@Body() createFormationDto: CreateFormationDto, @CurrentUser() user: User) {
    return this.formationsService.create(createFormationDto, user);
  }

  // Get all formations with optional filters
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
    @Query('shape') shape?: FormationShape,
    @Query('isTemplate', new ParseBoolPipe({ optional: true })) isTemplate?: boolean,
  ) {
    return this.formationsService.findAll(userId, teamId, shape, isTemplate);
  }

  // Get system templates
  @Get('templates')
  getTemplates() {
    return this.formationsService.getTemplates();
  }

  // Get a specific formation
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formationsService.findOne(id);
  }

  // Update a formation
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFormationDto: UpdateFormationDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.update(id, updateFormationDto, user);
  }

  // Delete a formation
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.formationsService.remove(id, user);
  }

  // Clone a formation
  @Post(':id/clone')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  clone(
    @Param('id', ParseIntPipe) id: number,
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId: number | undefined,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.clone(id, user, teamId);
  }

  /**
   * FORMATION POSITION ENDPOINTS
   */

  // Add a position to a formation
  @Post(':id/positions')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  addPosition(
    @Param('id', ParseIntPipe) formationId: number,
    @Body() createPositionDto: CreateFormationPositionDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.addPosition(formationId, createPositionDto, user);
  }

  // Update a position
  @Patch('positions/:positionId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updatePosition(
    @Param('positionId', ParseIntPipe) positionId: number,
    @Body() updatePositionDto: UpdateFormationPositionDto,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.updatePosition(positionId, updatePositionDto, user);
  }

  // Remove a position
  @Delete('positions/:positionId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  removePosition(@Param('positionId', ParseIntPipe) positionId: number, @CurrentUser() user: User) {
    return this.formationsService.removePosition(positionId, user);
  }

  // Assign a player to a position
  @Post('positions/:positionId/player/:playerId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  assignPlayer(
    @Param('positionId', ParseIntPipe) positionId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @CurrentUser() user: User,
  ) {
    return this.formationsService.assignPlayer(positionId, playerId, user);
  }

  // Remove player from a position
  @Delete('positions/:positionId/player')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  removePlayer(@Param('positionId', ParseIntPipe) positionId: number, @CurrentUser() user: User) {
    return this.formationsService.removePlayer(positionId, user);
  }

  // Get default formation for a team
  @Get('team/:teamId/default')
  getDefaultFormation(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.formationsService.getDefaultFormation(teamId);
  }
}

