import { IsEmail, IsEnum, IsOptional, IsInt, Min, Max, IsString, MaxLength } from 'class-validator';
import { InvitationRole } from '../entities/team-invitation.entity';

export class InviteTeamMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(InvitationRole)
  role: InvitationRole;

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
