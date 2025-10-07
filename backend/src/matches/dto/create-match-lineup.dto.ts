import { IsNumber, IsEnum, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { PlayerPosition } from '../../players/entities/player.entity';

export class CreateMatchLineupDto {
  @IsNumber()
  matchId: number;

  @IsNumber()
  teamId: number;

  @IsNumber()
  playerId: number;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsOptional()
  @IsBoolean()
  isStarting?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  jerseyNumber?: number;
}
