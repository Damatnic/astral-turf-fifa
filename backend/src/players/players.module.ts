import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { Player } from './entities/player.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { PlayerAttributes } from './entities/player-attributes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player, PlayerStats, PlayerAttributes])],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
