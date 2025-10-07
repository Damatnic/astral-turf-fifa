import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsNumber, MaxLength } from 'class-validator';
import { FormationShape, TacticalInstructions } from '../entities/formation.types';

export class CreateFormationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(FormationShape)
  shape: FormationShape;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  teamId?: number;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  tacticalInstructions?: TacticalInstructions;
}
