import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerPosition, PlayerStatus } from './entities/player.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { PlayerAttributes } from './entities/player-attributes.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CreatePlayerStatsDto } from './dto/create-player-stats.dto';
import { UpdatePlayerStatsDto } from './dto/update-player-stats.dto';
import { UpdatePlayerAttributesDto } from './dto/update-player-attributes.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(PlayerStats)
    private playerStatsRepository: Repository<PlayerStats>,
    @InjectRepository(PlayerAttributes)
    private playerAttributesRepository: Repository<PlayerAttributes>,
  ) {}

  // Create a new player
  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    // Check if jersey number is already taken in the team
    if (createPlayerDto.teamId && createPlayerDto.jerseyNumber) {
      const existingPlayer = await this.playersRepository.findOne({
        where: {
          teamId: createPlayerDto.teamId,
          jerseyNumber: createPlayerDto.jerseyNumber,
        },
      });

      if (existingPlayer) {
        throw new ConflictException(
          `Jersey number ${createPlayerDto.jerseyNumber} is already taken in this team`,
        );
      }
    }

    const player = this.playersRepository.create(createPlayerDto);
    const savedPlayer = await this.playersRepository.save(player);

    // Create default attributes for the player
    const attributes = this.playerAttributesRepository.create({
      playerId: savedPlayer.id,
    });
    await this.playerAttributesRepository.save(attributes);

    // Calculate and update overall rating
    const position = savedPlayer.position;
    attributes.overallRating = attributes.calculateOverallRating(position);
    await this.playerAttributesRepository.save(attributes);

    return savedPlayer;
  }

  // Get all players
  async findAll(teamId?: number, position?: PlayerPosition, status?: PlayerStatus): Promise<Player[]> {
    const query = this.playersRepository.createQueryBuilder('player')
      .leftJoinAndSelect('player.team', 'team')
      .leftJoinAndSelect('player.attributes', 'attributes')
      .orderBy('player.lastName', 'ASC');

    if (teamId) {
      query.andWhere('player.teamId = :teamId', { teamId });
    }

    if (position) {
      query.andWhere('player.position = :position', { position });
    }

    if (status) {
      query.andWhere('player.status = :status', { status });
    }

    return query.getMany();
  }

  // Get a single player by ID
  async findOne(id: number): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team', 'attributes', 'stats', 'user'],
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  // Get players by team
  async findByTeam(teamId: number): Promise<Player[]> {
    return this.playersRepository.find({
      where: { teamId },
      relations: ['attributes'],
      order: { jerseyNumber: 'ASC' },
    });
  }

  // Get players by position
  async findByPosition(position: PlayerPosition): Promise<Player[]> {
    return this.playersRepository.find({
      where: { position },
      relations: ['team', 'attributes'],
      order: { lastName: 'ASC' },
    });
  }

  // Get free agents (players without a team)
  async findFreeAgents(): Promise<Player[]> {
    return this.playersRepository.createQueryBuilder('player')
      .leftJoinAndSelect('player.attributes', 'attributes')
      .where('player.teamId IS NULL')
      .orderBy('player.lastName', 'ASC')
      .getMany();
  }

  // Update a player
  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.findOne(id);

    // Check if new jersey number conflicts
    if (updatePlayerDto.jerseyNumber && updatePlayerDto.jerseyNumber !== player.jerseyNumber) {
      const teamId = updatePlayerDto.teamId || player.teamId;
      if (teamId) {
        const existingPlayer = await this.playersRepository.findOne({
          where: {
            teamId,
            jerseyNumber: updatePlayerDto.jerseyNumber,
          },
        });

        if (existingPlayer && existingPlayer.id !== id) {
          throw new ConflictException(
            `Jersey number ${updatePlayerDto.jerseyNumber} is already taken in this team`,
          );
        }
      }
    }

    Object.assign(player, updatePlayerDto);
    return this.playersRepository.save(player);
  }

  // Delete a player
  async remove(id: number): Promise<void> {
    const player = await this.findOne(id);
    await this.playersRepository.remove(player);
  }

  // Assign player to a team
  async assignToTeam(playerId: number, teamId: number): Promise<Player> {
    const player = await this.findOne(playerId);
    player.teamId = teamId;
    return this.playersRepository.save(player);
  }

  // Remove player from team (make free agent)
  async removeFromTeam(playerId: number): Promise<Player> {
    const player = await this.findOne(playerId);
    player.teamId = null;
    player.jerseyNumber = null;
    return this.playersRepository.save(player);
  }

  // Update player status
  async updateStatus(playerId: number, status: PlayerStatus): Promise<Player> {
    const player = await this.findOne(playerId);
    player.status = status;
    return this.playersRepository.save(player);
  }

  // Upload player photo
  async updatePhoto(playerId: number, photoUrl: string): Promise<Player> {
    const player = await this.findOne(playerId);
    player.photoUrl = photoUrl;
    return this.playersRepository.save(player);
  }

  // ============ PLAYER STATS METHODS ============

  // Create or update player stats for a season
  async createStats(createStatsDto: CreatePlayerStatsDto): Promise<PlayerStats> {
    await this.findOne(createStatsDto.playerId); // Verify player exists

    // Check if stats already exist for this player and season
    const existingStats = await this.playerStatsRepository.findOne({
      where: {
        playerId: createStatsDto.playerId,
        season: createStatsDto.season,
      },
    });

    if (existingStats) {
      throw new ConflictException(
        `Stats already exist for player ${createStatsDto.playerId} in season ${createStatsDto.season}`,
      );
    }

    const stats = this.playerStatsRepository.create(createStatsDto);
    return this.playerStatsRepository.save(stats);
  }

  // Get stats for a player
  async getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]> {
    const query = this.playerStatsRepository.createQueryBuilder('stats')
      .where('stats.playerId = :playerId', { playerId });

    if (season) {
      query.andWhere('stats.season = :season', { season });
    }

    return query.orderBy('stats.season', 'DESC').getMany();
  }

  // Update player stats
  async updateStats(
    playerId: number,
    season: string,
    updateStatsDto: UpdatePlayerStatsDto,
  ): Promise<PlayerStats> {
    const stats = await this.playerStatsRepository.findOne({
      where: { playerId, season },
    });

    if (!stats) {
      throw new NotFoundException(
        `Stats not found for player ${playerId} in season ${season}`,
      );
    }

    Object.assign(stats, updateStatsDto);
    return this.playerStatsRepository.save(stats);
  }

  // ============ PLAYER ATTRIBUTES METHODS ============

  // Get player attributes
  async getAttributes(playerId: number): Promise<PlayerAttributes> {
    const attributes = await this.playerAttributesRepository.findOne({
      where: { playerId },
    });

    if (!attributes) {
      throw new NotFoundException(`Attributes not found for player ${playerId}`);
    }

    return attributes;
  }

  // Update player attributes
  async updateAttributes(
    playerId: number,
    updateAttributesDto: UpdatePlayerAttributesDto,
  ): Promise<PlayerAttributes> {
    const attributes = await this.getAttributes(playerId);
    const player = await this.findOne(playerId);

    Object.assign(attributes, updateAttributesDto);

    // Recalculate overall rating
    attributes.overallRating = attributes.calculateOverallRating(player.position);

    return this.playerAttributesRepository.save(attributes);
  }

  // Get top players by overall rating
  async getTopPlayers(limit: number = 10, position?: PlayerPosition): Promise<Player[]> {
    const query = this.playersRepository.createQueryBuilder('player')
      .leftJoinAndSelect('player.attributes', 'attributes')
      .leftJoinAndSelect('player.team', 'team')
      .orderBy('attributes.overallRating', 'DESC')
      .limit(limit);

    if (position) {
      query.where('player.position = :position', { position });
    }

    return query.getMany();
  }
}

