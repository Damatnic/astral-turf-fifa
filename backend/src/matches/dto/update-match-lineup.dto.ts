import { IsNumber, Min, Max } from 'class-validator';

export class UpdateMatchLineupDto {
  @IsNumber()
  @Min(0)
  minutesPlayed: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;
}
