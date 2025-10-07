import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { FormationPosition } from './entities/formation-position.entity';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreateFormationPositionDto } from './dto/create-formation-position.dto';
import { UpdateFormationPositionDto } from './dto/update-formation-position.dto';
import { FormationShape } from './entities/formation.types';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private formationsRepository: Repository<Formation>,
    @InjectRepository(FormationPosition)
    private formationPositionsRepository: Repository<FormationPosition>,
  ) {}

  /**
   * FORMATION CRUD OPERATIONS
   */

  // Create a new formation
  async create(createFormationDto: CreateFormationDto, user: User): Promise<Formation> {
    // If setting as default, unset any existing default formations for this team
    if (createFormationDto.isDefault && createFormationDto.teamId) {
      await this.formationsRepository.update(
        { teamId: createFormationDto.teamId, isDefault: true },
        { isDefault: false },
      );
    }

    const formation = this.formationsRepository.create({
      ...createFormationDto,
      ownerId: user.id,
    });

    return this.formationsRepository.save(formation);
  }

  // Get all formations with optional filters
  async findAll(
    userId?: string,
    teamId?: number,
    shape?: FormationShape,
    isTemplate?: boolean,
  ): Promise<Formation[]> {
    const query = this.formationsRepository
      .createQueryBuilder('formation')
      .leftJoinAndSelect('formation.owner', 'owner')
      .leftJoinAndSelect('formation.team', 'team')
      .leftJoinAndSelect('formation.positions', 'positions')
      .leftJoinAndSelect('positions.player', 'player')
      .orderBy('formation.createdAt', 'DESC');

    if (userId !== undefined) {
      query.andWhere('formation.ownerId = :userId', { userId });
    }

    if (teamId !== undefined) {
      query.andWhere('formation.teamId = :teamId', { teamId });
    }

    if (shape) {
      query.andWhere('formation.shape = :shape', { shape });
    }

    if (isTemplate !== undefined) {
      query.andWhere('formation.isTemplate = :isTemplate', { isTemplate });
    }

    return query.getMany();
  }

  // Get a single formation by ID
  async findOne(id: number): Promise<Formation> {
    const formation = await this.formationsRepository.findOne({
      where: { id },
      relations: ['owner', 'team', 'positions', 'positions.player'],
    });

    if (!formation) {
      throw new NotFoundException(`Formation with ID ${id} not found`);
    }

    return formation;
  }

  // Update a formation
  async update(
    id: number,
    updateFormationDto: UpdateFormationDto,
    user: User,
  ): Promise<Formation> {
    const formation = await this.findOne(id);

    // Check permissions
    if (formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this formation');
    }

    // If setting as default, unset any existing default formations for this team
    if (updateFormationDto.isDefault && formation.teamId) {
      await this.formationsRepository.update(
        { teamId: formation.teamId, isDefault: true, id: Not(id) },
        { isDefault: false },
      );
    }

    Object.assign(formation, updateFormationDto);
    return this.formationsRepository.save(formation);
  }

  // Delete a formation
  async remove(id: number, user: User): Promise<void> {
    const formation = await this.findOne(id);

    // Check permissions
    if (formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this formation');
    }

    await this.formationsRepository.remove(formation);
  }

  /**
   * FORMATION TEMPLATE OPERATIONS
   */

  // Get all system templates
  async getTemplates(): Promise<Formation[]> {
    return this.formationsRepository.find({
      where: { isTemplate: true },
      relations: ['positions'],
      order: { shape: 'ASC', name: 'ASC' },
    });
  }

  // Clone a formation (create a copy)
  async clone(id: number, user: User, teamId?: number): Promise<Formation> {
    const original = await this.findOne(id);

    const cloned = this.formationsRepository.create({
      name: `${original.name} (Copy)`,
      shape: original.shape,
      description: original.description,
      ownerId: user.id,
      teamId: teamId || null,
      isTemplate: false,
      isDefault: false,
      tacticalInstructions: original.tacticalInstructions,
    });

    const savedFormation = await this.formationsRepository.save(cloned);

    // Clone all positions
    if (original.positions && original.positions.length > 0) {
      const clonedPositions = original.positions.map((pos) =>
        this.formationPositionsRepository.create({
          formationId: savedFormation.id,
          position: pos.position,
          positionX: pos.positionX,
          positionY: pos.positionY,
          role: pos.role,
          instructions: pos.instructions,
          // Don't clone player assignments
          playerId: null,
        }),
      );

      await this.formationPositionsRepository.save(clonedPositions);
    }

    return this.findOne(savedFormation.id);
  }

  /**
   * FORMATION POSITION OPERATIONS
   */

  // Add a position to a formation
  async addPosition(
    formationId: number,
    createPositionDto: CreateFormationPositionDto,
    user: User,
  ): Promise<FormationPosition> {
    const formation = await this.findOne(formationId);

    // Check permissions
    if (formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this formation');
    }

    const position = this.formationPositionsRepository.create({
      ...createPositionDto,
      formationId,
    });

    return this.formationPositionsRepository.save(position);
  }

  // Update a position
  async updatePosition(
    positionId: number,
    updatePositionDto: UpdateFormationPositionDto,
    user: User,
  ): Promise<FormationPosition> {
    const position = await this.formationPositionsRepository.findOne({
      where: { id: positionId },
      relations: ['formation'],
    });

    if (!position) {
      throw new NotFoundException(`Formation position with ID ${positionId} not found`);
    }

    // Check permissions
    if (position.formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this position');
    }

    Object.assign(position, updatePositionDto);
    return this.formationPositionsRepository.save(position);
  }

  // Remove a position from a formation
  async removePosition(positionId: number, user: User): Promise<void> {
    const position = await this.formationPositionsRepository.findOne({
      where: { id: positionId },
      relations: ['formation'],
    });

    if (!position) {
      throw new NotFoundException(`Formation position with ID ${positionId} not found`);
    }

    // Check permissions
    if (position.formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this position');
    }

    await this.formationPositionsRepository.remove(position);
  }

  // Assign a player to a position
  async assignPlayer(
    positionId: number,
    playerId: number,
    user: User,
  ): Promise<FormationPosition> {
    const position = await this.formationPositionsRepository.findOne({
      where: { id: positionId },
      relations: ['formation'],
    });

    if (!position) {
      throw new NotFoundException(`Formation position with ID ${positionId} not found`);
    }

    // Check permissions
    if (position.formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this position');
    }

    position.playerId = playerId;
    return this.formationPositionsRepository.save(position);
  }

  // Remove player from a position
  async removePlayer(positionId: number, user: User): Promise<FormationPosition> {
    const position = await this.formationPositionsRepository.findOne({
      where: { id: positionId },
      relations: ['formation'],
    });

    if (!position) {
      throw new NotFoundException(`Formation position with ID ${positionId} not found`);
    }

    // Check permissions
    if (position.formation.ownerId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to modify this position');
    }

    position.playerId = null;
    return this.formationPositionsRepository.save(position);
  }

  // Get default formation for a team
  async getDefaultFormation(teamId: number): Promise<Formation | null> {
    const formation = await this.formationsRepository.findOne({
      where: { teamId, isDefault: true },
      relations: ['positions', 'positions.player'],
    });

    return formation;
  }
}

