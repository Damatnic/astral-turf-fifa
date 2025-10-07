import { PartialType } from '@nestjs/mapped-types';
import { CreateFormationPositionDto } from './create-formation-position.dto';

export class UpdateFormationPositionDto extends PartialType(CreateFormationPositionDto) {}
