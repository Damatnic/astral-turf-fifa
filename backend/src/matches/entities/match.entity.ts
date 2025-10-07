import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Formation } from '../../formations/entities/formation.entity';
import { User } from '../../users/entities/user.entity';
import { MatchLineup } from './match-lineup.entity';
import { MatchEvent } from './match-event.entity';
import { MatchStatus } from './match.types';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  homeTeamId: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam: Team;

  @Column()
  awayTeamId: number;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam: Team;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: MatchStatus.SCHEDULED,
  })
  status: MatchStatus;

  @Column({ type: 'int', nullable: true })
  homeScore: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore: number | null;

  @Column({ length: 200, nullable: true })
  venue: string;

  @Column({ length: 100, nullable: true })
  competition: string;

  @Column({ length: 50, nullable: true })
  round: string;

  @Column({ nullable: true })
  homeFormationId: number | null;

  @ManyToOne(() => Formation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'homeFormationId' })
  homeFormation: Formation;

  @Column({ nullable: true })
  awayFormationId: number | null;

  @ManyToOne(() => Formation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'awayFormationId' })
  awayFormation: Formation;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => MatchLineup, (lineup) => lineup.match, { cascade: true })
  lineups: MatchLineup[];

  @OneToMany(() => MatchEvent, (event) => event.match, { cascade: true })
  events: MatchEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property: match duration
  get duration(): number | null {
    if (this.startedAt && this.endedAt) {
      return Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000 / 60);
    }
    return null;
  }

  // Computed property: is match finished
  get isFinished(): boolean {
    return this.status === MatchStatus.COMPLETED;
  }

  // Computed property: is match live
  get isLive(): boolean {
    return this.status === MatchStatus.IN_PROGRESS;
  }
}
