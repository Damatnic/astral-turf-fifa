import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreatePlayerStatsDto {
  @IsInt()
  playerId: number;

  @IsString()
  season: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  matchesPlayed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minutesPlayed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  goals?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  assists?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yellowCards?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  redCards?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cleanSheets?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  saves?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passAccuracy?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  shotAccuracy?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  averageRating?: number;
}
