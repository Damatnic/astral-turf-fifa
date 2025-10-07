import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { MatchEventType } from '../entities/match.types';

export class CreateMatchEventDto {
  @IsNumber()
  matchId: number;

  @IsNumber()
  teamId: number;

  @IsOptional()
  @IsNumber()
  playerId?: number;

  @IsEnum(MatchEventType)
  eventType: MatchEventType;

  @IsNumber()
  @Min(0)
  minute: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraTime?: number;

  @IsOptional()
  @IsNumber()
  relatedPlayerId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
