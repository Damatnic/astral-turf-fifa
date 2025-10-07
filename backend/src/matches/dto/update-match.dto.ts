import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { CreateMatchDto } from './create-match.dto';
import { MatchStatus } from '../entities/match.types';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @IsOptional()
  @IsNumber()
  homeScore?: number;

  @IsOptional()
  @IsNumber()
  awayScore?: number;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
