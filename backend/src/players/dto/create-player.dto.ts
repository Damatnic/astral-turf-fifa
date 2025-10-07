import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
  Length,
  IsNumber,
} from 'class-validator';
import {
  PlayerPosition,
  PreferredFoot,
  PlayerStatus,
} from '../entities/player.entity';

export class CreatePlayerDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  teamId?: number;

  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsOptional()
  @IsEnum(PreferredFoot)
  preferredFoot?: PreferredFoot;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  height?: number; // in centimeters

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(150)
  weight?: number; // in kilograms

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  jerseyNumber?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;

  @IsOptional()
  @IsDateString()
  contractStart?: string;

  @IsOptional()
  @IsDateString()
  contractEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marketValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
