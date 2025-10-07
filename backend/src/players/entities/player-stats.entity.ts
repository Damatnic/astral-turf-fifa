import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from './player.entity';

@Entity('player_stats')
export class PlayerStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  playerId: number;

  @Column({ type: 'varchar', length: 20, comment: 'e.g., 2023-2024' })
  season: string;

  @Column({ type: 'int', default: 0 })
  matchesPlayed: number;

  @Column({ type: 'int', default: 0 })
  minutesPlayed: number;

  @Column({ type: 'int', default: 0 })
  goals: number;

  @Column({ type: 'int', default: 0 })
  assists: number;

  @Column({ type: 'int', default: 0 })
  yellowCards: number;

  @Column({ type: 'int', default: 0 })
  redCards: number;

  @Column({ type: 'int', default: 0, comment: 'For goalkeepers' })
  cleanSheets: number;

  @Column({ type: 'int', default: 0, comment: 'For goalkeepers' })
  saves: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Percentage 0-100',
  })
  passAccuracy: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Percentage 0-100',
  })
  shotAccuracy: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    comment: 'Average match rating 0-10',
  })
  averageRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Player, (player) => player.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;
}
