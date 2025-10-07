import { IsNumber, IsDate, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { MatchStatus } from '../entities/match.types';

export class CreateMatchDto {
  @IsNumber()
  homeTeamId: number;

  @IsNumber()
  awayTeamId: number;

  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  venue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  competition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  round?: string;

  @IsOptional()
  @IsNumber()
  homeFormationId?: number;

  @IsOptional()
  @IsNumber()
  awayFormationId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
