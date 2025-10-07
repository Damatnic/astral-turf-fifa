import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdatePlayerAttributesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pace?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  acceleration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  stamina?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  strength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  agility?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  jumping?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  ballControl?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  dribbling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  crossing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  shooting?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  longShots?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  finishing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  heading?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  marking?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  tackling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  interceptions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  positioning?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  diving?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  handling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  kicking?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  reflexes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  vision?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  composure?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  workRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  teamwork?: number;
}
