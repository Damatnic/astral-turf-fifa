import { IsEnum, IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator';
import { PlayerPosition } from '../../players/entities/player.entity';
import { PlayerRole } from '../entities/formation.types';
import { PositionInstructions } from '../entities/formation-position.entity';

export class CreateFormationPositionDto {
  @IsNumber()
  formationId: number;

  @IsOptional()
  @IsNumber()
  playerId?: number;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsNumber()
  @Min(0)
  @Max(100)
  positionX: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  positionY: number;

  @IsOptional()
  @IsEnum(PlayerRole)
  role?: PlayerRole;

  @IsOptional()
  @IsObject()
  instructions?: PositionInstructions;
}
