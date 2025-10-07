import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { Team } from '../../teams/entities/team.entity';
import { Player } from '../../players/entities/player.entity';
import { MatchEventType } from './match.types';

@Entity('match_events')
export class MatchEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  matchId: number;

  @ManyToOne(() => Match, (match) => match.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column()
  teamId: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ nullable: true })
  playerId: number | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @Column({
    type: 'varchar',
    length: 30,
  })
  eventType: MatchEventType;

  @Column()
  minute: number;

  @Column({ nullable: true })
  extraTime: number | null;

  @Column({ nullable: true })
  relatedPlayerId: number | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relatedPlayerId' })
  relatedPlayer: Player;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  // Helper computed property for display
  get minuteDisplay(): string {
    if (this.extraTime) {
      return `${this.minute}+${this.extraTime}'`;
    }
    return `${this.minute}'`;
  }
}
