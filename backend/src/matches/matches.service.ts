import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Match } from './entities/match.entity';
import { MatchLineup } from './entities/match-lineup.entity';
import { MatchEvent } from './entities/match-event.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMatchLineupDto } from './dto/create-match-lineup.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { UpdateMatchLineupDto } from './dto/update-match-lineup.dto';
import { MatchStatus, MatchEventType } from './entities/match.types';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(MatchLineup)
    private matchLineupRepository: Repository<MatchLineup>,
    @InjectRepository(MatchEvent)
    private matchEventRepository: Repository<MatchEvent>,
  ) {}

  /**
   * MATCH CRUD OPERATIONS
   */

  // Create a new match
  async create(createMatchDto: CreateMatchDto, user: User): Promise<Match> {
    // Validate teams are different
    if (createMatchDto.homeTeamId === createMatchDto.awayTeamId) {
      throw new BadRequestException('Home team and away team cannot be the same');
    }

    const match = this.matchesRepository.create({
      ...createMatchDto,
      createdById: user.id,
    });

    return this.matchesRepository.save(match);
  }

  // Get all matches with optional filters
  async findAll(
    teamId?: number,
    status?: MatchStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Match[]> {
    const query = this.matchesRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .leftJoinAndSelect('match.homeFormation', 'homeFormation')
      .leftJoinAndSelect('match.awayFormation', 'awayFormation')
      .orderBy('match.scheduledAt', 'DESC');

    if (teamId) {
      query.andWhere('(match.homeTeamId = :teamId OR match.awayTeamId = :teamId)', { teamId });
    }

    if (status) {
      query.andWhere('match.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('match.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    } else if (startDate) {
      query.andWhere('match.scheduledAt >= :startDate', { startDate });
    } else if (endDate) {
      query.andWhere('match.scheduledAt <= :endDate', { endDate });
    }

    return query.getMany();
  }

  // Get a single match by ID
  async findOne(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: [
        'homeTeam',
        'awayTeam',
        'homeFormation',
        'awayFormation',
        'createdBy',
        'lineups',
        'lineups.player',
        'lineups.team',
        'events',
        'events.player',
        'events.team',
        'events.relatedPlayer',
      ],
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  // Update a match
  async update(id: number, updateMatchDto: UpdateMatchDto, user: User): Promise<Match> {
    const match = await this.findOne(id);

    // Check permissions
    if (match.createdById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this match');
    }

    Object.assign(match, updateMatchDto);
    return this.matchesRepository.save(match);
  }

  // Delete a match
  async remove(id: number, user: User): Promise<void> {
    const match = await this.findOne(id);

    // Check permissions
    if (match.createdById !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this match');
    }

    await this.matchesRepository.remove(match);
  }

  /**
   * MATCH STATUS OPERATIONS
   */

  // Start a match
  async startMatch(id: number, user: User): Promise<Match> {
    const match = await this.findOne(id);

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Match cannot be started (not scheduled)');
    }

    match.status = MatchStatus.IN_PROGRESS;
    match.startedAt = new Date();
    match.homeScore = 0;
    match.awayScore = 0;

    return this.matchesRepository.save(match);
  }

  // End a match
  async endMatch(id: number, user: User): Promise<Match> {
    const match = await this.findOne(id);

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Match cannot be ended (not in progress)');
    }

    match.status = MatchStatus.COMPLETED;
    match.endedAt = new Date();

    // Update player stats after match completion would go here
    // This would integrate with PlayerStatsService

    return this.matchesRepository.save(match);
  }

  /**
   * LINEUP MANAGEMENT
   */

  // Add player to lineup
  async addToLineup(createLineupDto: CreateMatchLineupDto, user: User): Promise<MatchLineup> {
    const match = await this.findOne(createLineupDto.matchId);

    // Check if player is already in lineup
    const existingLineup = await this.matchLineupRepository.findOne({
      where: {
        matchId: createLineupDto.matchId,
        playerId: createLineupDto.playerId,
      },
    });

    if (existingLineup) {
      throw new BadRequestException('Player is already in the lineup');
    }

    const lineup = this.matchLineupRepository.create(createLineupDto);
    return this.matchLineupRepository.save(lineup);
  }

  // Remove player from lineup
  async removeFromLineup(lineupId: number, user: User): Promise<void> {
    const lineup = await this.matchLineupRepository.findOne({ where: { id: lineupId } });

    if (!lineup) {
      throw new NotFoundException(`Lineup entry with ID ${lineupId} not found`);
    }

    await this.matchLineupRepository.remove(lineup);
  }

  // Update lineup entry (minutes played, rating)
  async updateLineup(lineupId: number, updateDto: UpdateMatchLineupDto, user: User): Promise<MatchLineup> {
    const lineup = await this.matchLineupRepository.findOne({ 
      where: { id: lineupId },
      relations: ['player', 'team'],
    });

    if (!lineup) {
      throw new NotFoundException(`Lineup entry with ID ${lineupId} not found`);
    }

    Object.assign(lineup, updateDto);
    return this.matchLineupRepository.save(lineup);
  }

  // Get lineup for a match
  async getLineup(matchId: number, teamId?: number): Promise<MatchLineup[]> {
    const query = this.matchLineupRepository
      .createQueryBuilder('lineup')
      .leftJoinAndSelect('lineup.player', 'player')
      .leftJoinAndSelect('lineup.team', 'team')
      .where('lineup.matchId = :matchId', { matchId })
      .orderBy('lineup.isStarting', 'DESC')
      .addOrderBy('lineup.position', 'ASC');

    if (teamId) {
      query.andWhere('lineup.teamId = :teamId', { teamId });
    }

    return query.getMany();
  }

  /**
   * EVENT TRACKING
   */

  // Record a match event
  async recordEvent(createEventDto: CreateMatchEventDto, user: User): Promise<MatchEvent> {
    const match = await this.findOne(createEventDto.matchId);

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot record events for a match that is not in progress');
    }

    const event = this.matchEventRepository.create(createEventDto);
    const savedEvent = await this.matchEventRepository.save(event);

    // Update match score if it's a goal
    if (createEventDto.eventType === MatchEventType.GOAL) {
      if (createEventDto.teamId === match.homeTeamId) {
        match.homeScore = (match.homeScore || 0) + 1;
      } else if (createEventDto.teamId === match.awayTeamId) {
        match.awayScore = (match.awayScore || 0) + 1;
      }
      await this.matchesRepository.save(match);
    }

    return savedEvent;
  }

  // Delete an event
  async deleteEvent(eventId: number, user: User): Promise<void> {
    const event = await this.matchEventRepository.findOne({
      where: { id: eventId },
      relations: ['match'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Adjust score if deleting a goal
    if (event.eventType === MatchEventType.GOAL) {
      const match = event.match;
      if (event.teamId === match.homeTeamId && match.homeScore !== null && match.homeScore > 0) {
        match.homeScore -= 1;
        await this.matchesRepository.save(match);
      } else if (event.teamId === match.awayTeamId && match.awayScore !== null && match.awayScore > 0) {
        match.awayScore -= 1;
        await this.matchesRepository.save(match);
      }
    }

    await this.matchEventRepository.remove(event);
  }

  // Get events for a match
  async getEvents(matchId: number): Promise<MatchEvent[]> {
    return this.matchEventRepository.find({
      where: { matchId },
      relations: ['player', 'team', 'relatedPlayer'],
      order: { minute: 'ASC', extraTime: 'ASC' },
    });
  }

  /**
   * STATISTICS & REPORTS
   */

  // Get match summary
  async getMatchSummary(matchId: number) {
    const match = await this.findOne(matchId);
    const events = await this.getEvents(matchId);
    const lineups = await this.getLineup(matchId);

    // Group events by type
    const eventsByType = events.reduce((acc, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = [];
      }
      acc[event.eventType].push(event);
      return acc;
    }, {} as Record<string, MatchEvent[]>);

    return {
      match,
      lineups: {
        home: lineups.filter(l => l.teamId === match.homeTeamId),
        away: lineups.filter(l => l.teamId === match.awayTeamId),
      },
      events: eventsByType,
      statistics: {
        goals: {
          home: match.homeScore || 0,
          away: match.awayScore || 0,
        },
        yellowCards: {
          home: events.filter(e => e.eventType === MatchEventType.YELLOW_CARD && e.teamId === match.homeTeamId).length,
          away: events.filter(e => e.eventType === MatchEventType.YELLOW_CARD && e.teamId === match.awayTeamId).length,
        },
        redCards: {
          home: events.filter(e => e.eventType === MatchEventType.RED_CARD && e.teamId === match.homeTeamId).length,
          away: events.filter(e => e.eventType === MatchEventType.RED_CARD && e.teamId === match.awayTeamId).length,
        },
        substitutions: {
          home: events.filter(e => e.eventType === MatchEventType.SUBSTITUTION_IN && e.teamId === match.homeTeamId).length,
          away: events.filter(e => e.eventType === MatchEventType.SUBSTITUTION_IN && e.teamId === match.awayTeamId).length,
        },
      },
    };
  }
}
