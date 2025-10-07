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
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMatchLineupDto } from './dto/create-match-lineup.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchLineupDto } from './dto/update-match-lineup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { MatchStatus } from './entities/match.types';

@Controller('matches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * MATCH CRUD ENDPOINTS
   */

  // Create a new match
  @Post()
  @Roles(UserRole.ADMIN, UserRole.COACH)
  create(@Body() createMatchDto: CreateMatchDto, @CurrentUser() user: User) {
    return this.matchesService.create(createMatchDto, user);
  }

  // Get all matches with optional filters
  @Get()
  findAll(
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
    @Query('status') status?: MatchStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.matchesService.findAll(teamId, status, parsedStartDate, parsedEndDate);
  }

  // Get a specific match
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  // Get match summary (detailed stats and events)
  @Get(':id/summary')
  getMatchSummary(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.getMatchSummary(id);
  }

  // Update a match
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMatchDto: UpdateMatchDto,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.update(id, updateMatchDto, user);
  }

  // Delete a match
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.matchesService.remove(id, user);
  }

  /**
   * MATCH STATUS ENDPOINTS
   */

  // Start a match
  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  startMatch(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.matchesService.startMatch(id, user);
  }

  // End a match
  @Post(':id/end')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  endMatch(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.matchesService.endMatch(id, user);
  }

  /**
   * LINEUP MANAGEMENT ENDPOINTS
   */

  // Get lineup for a match
  @Get(':id/lineup')
  getLineup(
    @Param('id', ParseIntPipe) matchId: number,
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
  ) {
    return this.matchesService.getLineup(matchId, teamId);
  }

  // Add player to lineup
  @Post('lineup')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  addToLineup(@Body() createLineupDto: CreateMatchLineupDto, @CurrentUser() user: User) {
    return this.matchesService.addToLineup(createLineupDto, user);
  }

  // Update lineup entry
  @Patch('lineup/:lineupId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updateLineup(
    @Param('lineupId', ParseIntPipe) lineupId: number,
    @Body() updateLineupDto: UpdateMatchLineupDto,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.updateLineup(lineupId, updateLineupDto, user);
  }

  // Remove player from lineup
  @Delete('lineup/:lineupId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  removeFromLineup(@Param('lineupId', ParseIntPipe) lineupId: number, @CurrentUser() user: User) {
    return this.matchesService.removeFromLineup(lineupId, user);
  }

  /**
   * EVENT TRACKING ENDPOINTS
   */

  // Get events for a match
  @Get(':id/events')
  getEvents(@Param('id', ParseIntPipe) matchId: number) {
    return this.matchesService.getEvents(matchId);
  }

  // Record a match event
  @Post('events')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  recordEvent(@Body() createEventDto: CreateMatchEventDto, @CurrentUser() user: User) {
    return this.matchesService.recordEvent(createEventDto, user);
  }

  // Delete an event
  @Delete('events/:eventId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  deleteEvent(@Param('eventId', ParseIntPipe) eventId: number, @CurrentUser() user: User) {
    return this.matchesService.deleteEvent(eventId, user);
  }
}

