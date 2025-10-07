import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match } from './entities/match.entity';
import { MatchLineup } from './entities/match-lineup.entity';
import { MatchEvent } from './entities/match-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, MatchLineup, MatchEvent])],
  providers: [MatchesService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
