import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from '../../teams/entities/team.entity';
import { Player, PlayerPosition } from '../../players/entities/player.entity';

@Entity('match_lineups')
export class MatchLineup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchId: number;

  @ManyToOne(() => Match, (match) => match.lineups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  teamId: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column()
  playerId: number;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({ length: 10 })
  position: PlayerPosition;

  @Column({ default: true })
  isStarting: boolean;

  @Column({ nullable: true })
  jerseyNumber: number | null;

  @Column({ default: 0 })
  minutesPlayed: number;

  @Column({ type: 'float', nullable: true })
  rating: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
