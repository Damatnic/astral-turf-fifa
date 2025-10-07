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
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CreatePlayerStatsDto } from './dto/create-player-stats.dto';
import { UpdatePlayerStatsDto } from './dto/update-player-stats.dto';
import { UpdatePlayerAttributesDto } from './dto/update-player-attributes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PlayerPosition, PlayerStatus } from './entities/player.entity';

@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  // Create a new player
  @Post()
  @Roles(UserRole.ADMIN, UserRole.COACH)
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  // Get all players with optional filters
  @Get()
  findAll(
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
    @Query('position') position?: PlayerPosition,
    @Query('status') status?: PlayerStatus,
  ) {
    return this.playersService.findAll(teamId, position, status);
  }

  // Get top players by overall rating
  @Get('top')
  getTopPlayers(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('position') position?: PlayerPosition,
  ) {
    return this.playersService.getTopPlayers(limit, position);
  }

  // Get free agents (players without a team)
  @Get('free-agents')
  getFreeAgents() {
    return this.playersService.findFreeAgents();
  }

  // Get a specific player
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }

  // Update a player
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    return this.playersService.update(id, updatePlayerDto);
  }

  // Delete a player
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id);
  }

  // Assign player to a team
  @Post(':id/assign-team')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  assignToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.playersService.assignToTeam(id, teamId);
  }

  // Remove player from team (make free agent)
  @Post(':id/remove-from-team')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  removeFromTeam(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.removeFromTeam(id);
  }

  // Update player status
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PlayerStatus,
  ) {
    return this.playersService.updateStatus(id, status);
  }

  // Upload player photo
  @Patch(':id/photo')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updatePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.playersService.updatePhoto(id, photoUrl);
  }

  // ============ PLAYER STATS ENDPOINTS ============

  // Create stats for a player
  @Post(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  createStats(@Body() createStatsDto: CreatePlayerStatsDto) {
    return this.playersService.createStats(createStatsDto);
  }

  // Get stats for a player
  @Get(':id/stats')
  getPlayerStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('season') season?: string,
  ) {
    return this.playersService.getPlayerStats(id, season);
  }

  // Update stats for a player
  @Patch(':id/stats/:season')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updateStats(
    @Param('id', ParseIntPipe) id: number,
    @Param('season') season: string,
    @Body() updateStatsDto: UpdatePlayerStatsDto,
  ) {
    return this.playersService.updateStats(id, season, updateStatsDto);
  }

  // ============ PLAYER ATTRIBUTES ENDPOINTS ============

  // Get attributes for a player
  @Get(':id/attributes')
  getAttributes(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.getAttributes(id);
  }

  // Update attributes for a player
  @Patch(':id/attributes')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updateAttributes(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttributesDto: UpdatePlayerAttributesDto,
  ) {
    return this.playersService.updateAttributes(id, updateAttributesDto);
  }
}

