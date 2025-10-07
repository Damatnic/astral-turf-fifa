import { IsInt, IsEnum, IsOptional, Min, Max, IsString, MaxLength } from 'class-validator';
import { TeamRole } from '../entities/team-member.entity';

export class AddTeamMemberDto {
  @IsInt()
  userId: number;

  @IsEnum(TeamRole)
  role: TeamRole;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string;
}
